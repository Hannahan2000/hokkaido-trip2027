import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export interface Activity {
  id: number;
  time: string;
  title: string;
  location?: string;
  mapUrl?: string;
  note?: string;
  transit?: string; // 中間交通資訊
  type: 'flight' | 'hotel' | 'food' | 'spot' | 'transport'| 'taxi';
}

export interface DayPlan {
  dayId: number | string;
  date: string;
  title: string;
  activities: Activity[];
  areaSummary?: string; // 今日動線摘要 (方案 2)
  mapQuery?: string;    // 今日地圖搜尋中心/關鍵字 (方案 1)
}

@Component({
  selector: 'app-itinerary',
  templateUrl: './itinerary.component.html',
  styleUrls: ['./itinerary.component.scss']
})
export class ItineraryComponent implements OnInit {
  selectedDayId: number | string = 1;
  days: DayPlan[] = [];
  showResetModal: boolean = false;
  // 統一控管彈窗的所有狀態與文字
  modalConfig = {
    isOpen: false,
    mode: '', // 用來記錄現在是要 'reset' 還是 'delete'
    title: '',
    message: '',
    confirmText: ''
  };

  // 地圖展開狀態 (方案 1)
  isMapExpanded = false;

  // 編輯面板狀態
  isSheetOpen = false;
  editingAct: Partial<Activity> | null = null;
  isNew = false;
  isClosing = false;
  private touchStartY = 0;
  // 新增這個變數來專門控制動畫
  isSheetAnimating = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadData();
  }

  isNumber(val: any): boolean {
    return typeof val === 'number';
  }

  // 切換地圖顯示/收合
  toggleMap() {
    this.isMapExpanded = !this.isMapExpanded;
  }

  // 取得當前日期的 Google Maps 嵌入網址 (方案 1)
  get currentMapEmbedUrl(): SafeResourceUrl {
    const day = this.currentDay;
    if (!day) return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    const query = day.mapQuery || (day.activities.find(a => a.location)?.location || day.title);
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // 取得當前日期的 Google Maps 多點導航/路線規劃網址 (方案 2)
  get currentGoogleMapsRouteUrl(): string {
    const day = this.currentDay;
    if (!day || !day.activities || day.activities.length === 0) return '';
    const validStops = day.activities
      .map(a => a.location ? `${a.location} ${a.title}` : a.title)
      .filter(name => !name.includes('退房') && !name.includes('休息') && !name.includes('自由活動') && !name.includes('備案') && !name.includes('起飛') && !name.includes('降落') && !name.includes('前往機場'));

    if (validStops.length === 0) return '';
    if (validStops.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(validStops[0])}`;
    }

    const origin = encodeURIComponent(validStops[0]);
    const destination = encodeURIComponent(validStops[validStops.length - 1]);
    const waypoints = validStops.slice(1, -1).slice(0, 8).map(s => encodeURIComponent(s)).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? '&waypoints=' + waypoints : ''}`;
  }

  // 讀取資料 (若無存檔，則載入預設 9 天骨架；若有存檔，補齊動線與地圖欄位)
  loadData() {
    const saved = localStorage.getItem('hokkaido_itinerary');
    const defaultDays = this.generateDefault9Days();
    if (saved) {
      const parsedDays: DayPlan[] = JSON.parse(saved);
      this.days = parsedDays.map(d => {
        const def = defaultDays.find(x => x.dayId === d.dayId);
        return {
          ...def,
          ...d,
          areaSummary: d.areaSummary || def?.areaSummary,
          mapQuery: d.mapQuery || def?.mapQuery
        };
      });
    } else {
      this.days = defaultDays;
      this.saveData();
    }
  }

  // 2. 觸發「還原行程」時，設定文字並打開彈窗
  resetToDefault() {
    this.modalConfig = {
      isOpen: true,
      mode: 'reset',
      title: '確定要還原成預設行程嗎？',
      message: '這將會清除您所有的自訂修改與拖曳排序',
      confirmText: '還原'
    };
  }

  // 3. 觸發「單筆刪除」時，設定文字並打開彈窗
  deleteActivity() {
    if (!this.editingAct || !this.currentDay) return;
    this.modalConfig = {
      isOpen: true,
      mode: 'delete',
      title: `確定要刪除「${this.editingAct.title}」嗎？`,
      message: '刪除後將無法復原',
      confirmText: '刪除'
    };
  }

  // 4. 共用的關閉彈窗
  closeModal() {
    this.modalConfig.isOpen = false;
  }

  // 5. 統一的執行樞紐（看 mode 決定要執行哪件事）
  executeModalAction() {
    if (this.modalConfig.mode === 'reset') {
      localStorage.removeItem('hokkaido_itinerary');
      this.days = this.generateDefault9Days();
      this.saveData();
    } else if (this.modalConfig.mode === 'delete') {
      if (this.editingAct && this.currentDay) {
        this.currentDay.activities = this.currentDay.activities.filter(a => a.id !== this.editingAct!.id);
        this.saveData();
        this.closeSheet(); // 順便關閉編輯面板
      }
    }
    this.closeModal(); // 執行完關閉彈窗
  }

  drop(event: CdkDragDrop<Activity[]>) {
    if (this.currentDay) {
      moveItemInArray(this.currentDay.activities, event.previousIndex, event.currentIndex);
      this.saveData();
    }
  }

  saveData() {
    localStorage.setItem('hokkaido_itinerary', JSON.stringify(this.days));
  }

  get currentDay() {
    return this.days.find(d => d.dayId === this.selectedDayId);
  }

  selectDay(id: number | string) {
    this.selectedDayId = id;
  }

  // --- CRUD 功能 ---

  // 打開面板 (新增)
  addActivity() {
    this.isNew = true;
    this.editingAct = {
      id: Date.now(),
      time: '10:00',
      title: '',
      type: 'spot',
      location: '',
      note: '',
      transit: '',
      mapUrl: ''
    };
    this.isSheetOpen = true;
    setTimeout(() => {
      this.isSheetAnimating = true;
    }, 10);
  }

  // 打開面板 (編輯/查看細節)
  editActivity(act: Activity) {
    this.isNew = false;
    this.editingAct = { ...act }; // 複製一份出來編輯
    this.isSheetOpen = true;
    setTimeout(() => {
      this.isSheetAnimating = true;
    }, 10);
  }

  // 儲存行程
  saveActivity() {
    if (!this.editingAct || !this.editingAct.title || !this.currentDay) return;

    if (this.isNew) {
      // 新增：加入陣列後依時間排序
      this.currentDay.activities.push(this.editingAct as Activity);
    } else {
      // 修改：找出原本的並替換
      const index = this.currentDay.activities.findIndex(a => a.id === this.editingAct!.id);
      if (index !== -1) {
        this.currentDay.activities[index] = this.editingAct as Activity;
      }
    }

    this.saveData();
    this.closeSheet();
  }

  // 🔴 1. 找到你原本用來「打開」編輯視窗的 Function
  openEditModal(activity: any): void {
    this.editingAct = activity;
    setTimeout(() => {
      this.isSheetAnimating = true;
    }, 10);
  }

  // 🔴 2. 修改你剛剛寫的關閉 Function
  closeSheet(): void {
    this.isSheetAnimating = false;
    setTimeout(() => {
      this.editingAct = null;
    }, 300);
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartY = event.changedTouches[0].screenY;
  }

  // 🔴 3. 確保向下滑動關閉的邏輯也是呼叫 closeSheet()
  onTouchEnd(event: TouchEvent): void {
    const touchEndY = event.changedTouches[0].screenY;
    const swipeDistance = touchEndY - this.touchStartY;
    if (swipeDistance > 50) {
      this.closeSheet();
    }
  }

  // 自動轉換類別為圖示
  getIcon(type: string) {
    const icons = { flight: '✈️', hotel: '🏨', food: '🍽️', spot: '📍', transport: '🚆' };
    return icons[type as keyof typeof icons] || '🔸';
  }

  // 產生 9 天預設骨架與詳細行程
  private generateDefault9Days(): DayPlan[] {
    return [
      {
        dayId: 1, date: '03/05', title: '釜山快閃 ✈️ 抵達札幌',
        areaSummary: '釜山 (西面/田浦) ✈️ 札幌市區 (薄野)',
        mapQuery: '札幌市 中央區',
        activities: [
          { id: 95, time: '00:40', title: '桃園機場第一航廈', type: 'spot', note: '最晚抵達時間', transit: '' },
          { id: 96, time: '02:40', title: '起飛', type: 'flight', note: '', transit: '' },
          { id: 98, time: '06:10', title: '釜山金海機場 (PUS)', type: 'flight', note: '看是否能寄放行李', transit: '抵達後，搭車前往 西面站，地鐵約 40 分鐘' },
          { id: 100, time: '08:00', title: '早餐：秀英本家豬肉湯飯', location: '西面', type: 'food', note: '推薦加入蝦醬和韭菜提味', transit: '步行', mapUrl: 'https://maps.app.goo.gl/FjqZYNpdVijKxHVF9' },
          { id: 101, time: '09:30', title: 'Olive Young 西面店', location: '西面', type: 'spot', note: '滿15000韓元可直接辦理現場退稅', transit: '步行', mapUrl: 'https://maps.app.goo.gl/gJqkYo1tpTXGVUiU8' },
          { id: 102, time: '11:00', title: '香水店：SCENTICA', location: '田浦', type: 'spot', note: '香水', transit: '', mapUrl: 'https://maps.app.goo.gl/xUWmeqGK8wbewKBb6' },
          { id: 103, time: '11:20', title: '前往機場', type: 'taxi', transit: '搭車40分鐘，看是否搭計程車' },
          { id: 104, time: '11:50', title: '釜山金海機場 (PUS)', type: 'spot', transit: '' },
          { id: 104, time: '13:50', title: '起飛', type: 'flight', transit: '飛行時間約 2.5 小時' },
          { id: 105, time: '16:10', title: '新千歲機場 (CTS)', type: 'spot', transit: '步行至 B1 搭乘 JR' },
          { id: 106, time: '17:30', title: 'JR 快速機場線/公車', type: 'transport', transit: '1.機場快線車程約 45 分鐘/2230日幣 2.公車車程約75分鐘，每15分鐘一班/1500日幣' },
          { id: 107, time: '18:30', title: 'Solaria Nishitetsu', location: '札幌站旁', type: 'hotel', note:'入住飯店，放好行李後出發晚餐逛街', transit: '' },
          { id: 108, time: '19:00', title: '晚餐：湯咖哩 奧芝商店', location: '時計台店', type: 'food', note: '需現場排隊，時計台分店人潮較少', mapUrl: 'https://maps.app.goo.gl/zzx5RzmxH1rVmcB67' },
          { id: 109, time: '20:00', title: '弄頭髮/逛街', type: 'spot', note: '理髮/逛街', mapUrl: '' },
          { id: 110, time: '20:00', title: 'COCONO SUSUKINO', type: 'spot', note: '國王招牌拍照/可逛', mapUrl: 'https://maps.app.goo.gl/ho3HwnMdi1F6Huu28' },
        ]
      },
      {
        dayId: 2, date: '03/06', title: '小樽漫遊(魚市星期日休市注意)',
        areaSummary: '札幌 🚆 小樽運河 ➔ 堺町通 ➔ 朝里海景',
        mapQuery: '小樽運河',
        activities: [
          { id: 201, time: '09:00', title: '搭乘 JR 前往小樽', type: 'transport', note: '去程坐右側看海。若花束太大，抵達小樽後可先鎖在車站置物櫃' },
          { id: 202, time: '10:00', title: '早午餐備案 1：鱗友朝市', type: 'food', note: '推薦中沖水產活帝王蟹，但需注意過中午可能收攤', mapUrl: 'https://maps.app.goo.gl/5eg9PLHi7W1TAkoa8' },
          { id: 203, time: '11:30', title: '早午餐備案 2：三角市場', type: 'food', note: '海鮮丼熱門選擇', mapUrl: 'https://maps.app.goo.gl/d2X7ykE2e5cxshe87' },
          { id: 204, time: '13:00', title: '船見坂', type: 'spot', note: '順路步行上坡道遠眺海景', mapUrl: 'https://maps.app.goo.gl/mC6B6J7SKiJKsNXA6' },
          { id: 205, time: '14:00', title: '小樽運河散策', type: 'spot', note: '北海道最具代表性的景點之一', mapUrl: 'https://maps.app.goo.gl/s5HAzsV64KNMdKLx8' },
          { id: 20501, time: '14:00', title: '小樽可逛-MIFFY PORT TOWN 小樽店', type: 'spot', note: '', mapUrl: 'https://maps.app.goo.gl/x7xfs5ahYZ1vpkBq6' },
          { id: 20502, time: '14:00', title: '小樽可逛-北菓楼 小樽本館', type: 'spot', note: '', mapUrl: 'https://maps.app.goo.gl/swDMNy1cxDeGvqb99' },
          { id: 20503, time: '14:00', title: '小樽可逛-六花亭 小樽運河店', type: 'spot', note: '', mapUrl: 'https://maps.app.goo.gl/WZiLn8VZZeWborN26' },
          { id: 20504, time: '14:00', title: '小樽可逛-LeTAO', type: 'spot', note: '', mapUrl: 'https://maps.app.goo.gl/MWNFYLpPyiEeKDQp7' },
          // { id: 20505, time: '14:00', title: '小樽可逛-MIFFY PORT TOWN 小樽店', type: 'spot', note: '', mapUrl: 'https://maps.app.goo.gl/x7xfs5ahYZ1vpkBq6' },
          { id: 206, time: '15:00', title: '堺町通商店街 / 北一硝子', type: 'spot', note: '推薦 LeTAO 與北菓樓甜點，多數店家傍晚打烊', mapUrl: 'https://maps.app.goo.gl/dRNG8HQEufT7xwGY6' },
          { id: 207, time: '16:00', title: '小樽蒸汽鐘', type: 'spot', note: '每 15 分鐘噴出蒸汽，十字路口對面拍攝能將音樂盒堂完整同框', mapUrl: 'https://maps.app.goo.gl/rh22zkqY5pK1yvkH8' },
          { id: 208, time: '16:30', title: '搭 JR 準備回程 (短暫停留朝里)', type: 'transport', note: '回程記得坐左側看夕陽海景' },
          { id: 209, time: '17:30', title: '朝里站', type: 'spot', note: '絕美的日劇海景車站場景，拍完照搭下一班車回札幌', mapUrl: 'https://maps.app.goo.gl/DCdP6iV4AjPsGswS8' },
          { id: 210, time: '19:00', title: '晚餐備案1 ：焼き鳥りぶれ', location: '薄野店 (居酒屋)', type: 'food', note: '好吃居酒屋，記得先預約', mapUrl: 'https://maps.app.goo.gl/pcwYXsKGmYJhTD7o6' },
          { id: 210, time: '19:00', title: '晚餐備案2 ：やきとり おでん 然', location: '薄野店 (居酒屋)', type: 'food', note: '居酒屋', mapUrl: 'https://maps.app.goo.gl/mrAst6q7ArhbDSKE8' }
        ]
      },
      {
        dayId: 3, date: '03/07', title: '札幌市區',
        areaSummary: '圓山公園 (北海道神宮) ➔ 大通公園 ➔ 時計台 ➔ 狸小路',
        mapQuery: '大通公園 札幌',
        activities: [
          { id: 300, time: '10:00', title: '取花', type: 'spot', note: '' },
          { id: 301, time: '09:00', title: '早餐：Tully\'s Coffee', location: '札幌 STV 北2条店', type: 'food', note: '吧台設有充電插座，喝杯皇家奶茶充飽電再出發', mapUrl: 'https://maps.app.goo.gl/uwL8iXAqHAabXM239' },
          { id: 302, time: '10:00', title: '北海道神宮 (Hokkaido Jingu)', location: '圓山公園', type: 'spot', note: '', mapUrl: 'https://maps.app.goo.gl/FTN9kYko8d716xwW6' },
          { id: 304, time: '10:00', title: '圓山公園', location: '圓山公園', type: 'spot', note: '', mapUrl: 'https://maps.app.goo.gl/spyocEfZS1QFNhY58' },
          { id: 305, time: '11:30', title: '午餐拉麵1：貝拉麵 BUKOU', type: 'food', note: '醬油/貝湯底拉麵', transit: '', mapUrl: 'https://maps.app.goo.gl/D2Yvt6LGkH1cvJwB8' },
          { id: 306, time: '11:30', title: '午餐拉麵2：支那麵 鋳', type: 'food', note: '拉麵', transit: '', mapUrl: 'https://maps.app.goo.gl/h9tgqVMt2g5cxPe28' },
          { id: 307, time: '13:00', title: '北海道大學', type: 'spot', note: '雪景與建築', mapUrl: 'https://maps.app.goo.gl/axNbPW5qrvbwiyqQ7' },
          { id: 308, time: '14:00', title: '札幌諏訪神社', type: 'spot', note: '具有鳥居等傳統元素的神社，另有販售護身符', mapUrl: 'https://maps.app.goo.gl/h4pYwCtFdL1mFEw47' },
          { id: 309, time: '15:00', title: 'Essentia 香氛精油店', type: 'spot', note: '順路逛逛精油與香氣空間', mapUrl: 'https://maps.app.goo.gl/XvKNmE6x2mVDPRYR9' },
          { id: 310, time: '16:00', title: '下午茶：佐藤本店 (芭菲)', type: 'food', note: '逛完來吃超人氣的 Parfait 休息一下，外觀精緻好拍', mapUrl:'https://maps.app.goo.gl/cX4f4woou82Ykmt27' },
          { id: 311, time: '17:15', title: '大通公園 / 札幌電視塔', type: 'spot', note: '吃完甜點散步過來剛好傍晚，望遠鏡能看到遠處的海與纜車', mapUrl:'https://maps.app.goo.gl/Qeck3XDtxzRJZL9h8' },
          { id: 312, time: '17:45', title: '札幌時計台', type: 'spot', note: '代表性的木造鐘樓，內部設有關於札幌歷史的博物館。', mapUrl:'https://maps.app.goo.gl/NkXztVuCzcmRzPrr9' },
          { id: 313, time: '18:30', title: '晚餐備案 1：海味 はちきょう 本店', type: 'food', note: '老闆加鮭魚卵是店裡的 high 場，氣氛非常歡樂', mapUrl: 'https://maps.app.goo.gl/ZjD4eVd5ewpWw2G29' },
          { id: 314, time: '18:30', title: '晚餐備案 2：蟹壽司「蟹鮨加藤」', location: '狸小路店', type: 'food', note: '位於狸小路免受風雪影響。帝王蟹好吃，店員會協助剝殼。', mapUrl: 'https://maps.app.goo.gl/CZXNM7HRXMjpdYwg8' }
        ]
      },
      {
        dayId: 4, date: '03/08', title: '前往洞爺湖',
        areaSummary: '札幌出發 🚆 洞爺湖畔八景 🏨 湖之栖',
        mapQuery: '洞爺湖',
        activities: [
          { id: 401, time: '09:00', title: '辦理退房手續', type: 'hotel', note: '從札幌飯店退房，確認行李' },
          { id: 402, time: '10:00', title: '搭乘北斗號特急前往洞爺', type: 'transport' },
          { id: 403, time: '12:00', title: '洞爺湖午餐', type: 'food', note: '待安排' },
          { id: 404, time: '13:00', title: '湖底線路 洞爺湖', type: 'spot', note: '水中軌道', mapUrl: 'https://maps.app.goo.gl/v5sPobPyWv3xF4C2A' },
          { id: 405, time: '14:00', title: '洞爺湖八景', type: 'spot', note: '湖畔周邊設有充足的免費停車位供遊客使用。訪客推薦可以一邊泡免費足湯一邊享受愜意時光。', mapUrl:'https://maps.app.goo.gl/T56eL7j7EYwAFMrk8' },
          { id: 406, time: '15:00', title: '洞爺湖 越後屋', type: 'spot', note: '訪客說店外停著主角摩托車適合拍照。訪客說買短版木刀才能放進大行李箱。', mapUrl:'https://maps.app.goo.gl/cSpKVxNRZ26Wbdy19' },
          { id: 407, time: '16:00', title: '入住 The Lake Suite 湖之栖', type: 'hotel', note: '辦理入住，享受絕美溫泉與湖景' },
          { id: 408, time: '18:30', title: '飯店內用晚餐', type: 'food' }
        ]
      },
      {
        dayId: 5, date: '03/09', title: '洞爺湖出發 ➡️ 登別 ➡️ 札幌',
        areaSummary: '洞爺湖 ➔ 登別地獄谷 ➔ 札幌市區大採購',
        mapQuery: '登別地獄谷',
        activities: [
          { id: 502, time: '10:15', title: '--------登別備案----------搭乘 JR 特急北斗號 (往登別)', type: 'transport', transit: '車程約 40 分鐘' },
          { id: 503, time: '11:00', title: 'JR 登別站', type: 'spot', note: '車站內有大型置物櫃，放好行李後轉乘道南巴士前往溫泉街', transit: '巴士車程約 15 分鐘' },
          { id: 504, time: '11:30', title: '登別地獄谷散策', type: 'spot', note: '沿著木棧道欣賞壯觀的火山地熱與硫磺煙霧景觀' },
          { id: 505, time: '13:00', title: '午餐：登別溫泉街', type: 'food', note: '推薦「溫泉市場」吃海鮮，或品嚐當地特色的閻魔炒麵' },
          { id: 506, time: '14:30', title: '搭乘巴士返回 JR 登別站', type: 'transport', note: '記得取回置物櫃的大行李' },
          { id: 507, time: '15:20', title: '搭乘 JR 特急前往札幌', type: 'transport', transit: '車程約 1 小時 20 分鐘 (可在車上補眠)' },
          { id: 508, time: '17:00', title: '入住 格蘭貝爾札幌酒店', location: '札幌市區', type: 'hotel', transit: '放好行李稍作休息' },
          { id: 509, time: '09:30', title: '--------逛街備案----------搭乘接駁車', type: 'transport', transit: '車程約 1 小時 50 分鐘，直接回市區換取逛街時間' },
          { id: 510, time: '13:00', title: '抵達札幌，入住/寄放行李', location: '札幌市區', type: 'hotel', note: '放好行李準備大採購' },
          { id: 511, time: '13:30', title: '午餐：一夜干與海鮮丼 できたて屋', location: '時計台店', type: 'food', note: '白飯可免費續碗一次，推薦淋上高湯做成茶泡飯', mapUrl: 'https://maps.app.goo.gl/r6MbGd7quxXc2YHF9' },
          { id: 512, time: '14:30', title: '狸小路商店街 / 百貨商圈採買', type: 'spot', note: '提前把原本 Day 8 的購物行程移到這天下午，狸小路 6 丁目有香甜烤地瓜' },
          { id: 513, time: '18:30', title: '晚餐：市區自由覓食', type: 'food', note: '依照逛街進度隨意吃，或是補吃前幾天沒吃到的備案' },
        ]
      },
      {
        dayId: 6,  date: '03/10',  title: '美瑛/富良野 (雪地自駕)方案',
        areaSummary: '旭川 ➔ 美瑛白金青池 ➔ 聖誕樹 ➔ 上富良野',
        mapQuery: '美瑛 白金青池',
        activities: [
          {  id: 601,  time: '10:00',  title: '男山酒造資料館 / 高砂酒造',  type: 'spot',  note: '擇一參觀，駕駛請以水或甘酒代步' },
          {  id: 602,  time: '11:45',  title: '旭川拉麵村/旭川當地美食',  type: 'food',  note: '午餐暖胃，吃飽再進入美瑛山區' },
          {  id: 603,  time: '13:55',  title: '白金青池',  type: 'spot',  note: '冬季結冰積雪，主要欣賞寧靜的枯木雪景' },
          {  id: 604,  time: '15:00',  title: 'Kita Kouboh (北工房)',  type: 'food',  note: '自家烘焙咖啡，下午茶休息' },
          {  id: 605,  time: '16:15',  title: '聖誕樹 (Christmas Tree)',  type: 'spot',  note: '黃昏斜射光最美 ' },
          {  id: 606,  time: '17:00',  title: '上富良野 日之出公園',  type: 'spot',  note: '【彈性備案】看愛之鐘與雪白盆地。若天色太暗或太累可省略此點掉頭' },
          {  id: 607,  time: '18:45',  title: '返回旭川市區',  type: 'transport',  note: '夜間雪地視線較差！'},
          {  id: 608, time: '19:30', title: '晚餐：迴轉壽司 トリトン (Toriton)', location: '北8条光星店', type: 'food', note: '抽號碼牌後可掃碼用 LINE 查看進度！推薦油脂豐富的鮭魚壽司', mapUrl: 'https://maps.app.goo.gl/XFEa9u5ahKQu9oQK8' },
        ]
      },
      {
        dayId: 7, date: '03/11', title: '手稻滑雪課程',
        areaSummary: '薄野集合 🚌 手稻滑雪場 🚌 市區和牛壽喜燒',
        mapQuery: '手稻滑雪場',
        activities: [
          { id: 701, time: '07:30', title: '早餐：便利商店', type: 'food', note: '買些輕食與飯糰，準備一整天滑雪的體力', transit: '步行前往集合點' },
          { id: 702, time: '08:00', title: '集合與裝備領取', location: 'Infinity City 薄野店', type: 'spot', note: '完成報到手續，並由工作人員協助領取 Arc’teryx 始祖鳥滑雪服及其他滑雪裝備', transit: '搭乘巴士約 1 小時 5 分鐘' },
          { id: 703, time: '10:00', title: '抵達滑雪場與暖身', location: '手稻滑雪場', type: 'spot', note: '由專業教練帶領完成裝備最終調整、分組，並進行基礎暖身與滑雪安全規範講解' },
          { id: 704, time: '12:00', title: '午餐與休息', location: 'Highland/Olympia 餐廳', type: 'food', note: '於餐廳用餐並休息恢復體力' },
          { id: 705, time: '13:00', title: '真實雪道導滑', type: 'spot', note: '進行實際雪道滑行體驗 2 小時，加強滑行穩定度與安全控制能力' },
          { id: 706, time: '15:30', title: '準備返程', type: 'transport', transit: '搭乘巴士返回市區' },
          { id: 707, time: '18:30', title: '晚餐：涮涮鍋・壽喜燒 禪', location: '山口中央ビル 地下1階', type: 'food', note: '店家很熱門建議提前預約以免久候；店員會親切地幫忙烹煮第一輪肉品。', mapUrl: 'https://maps.app.goo.gl/upagKCwVTMXK5WXdA' }
        ]
      },
      {
        dayId: 8, date: '03/12', title: '市區逛街採買or滑雪',
        areaSummary: '薄野 (Donguri) ➔ 迴轉壽司 ➔ 札幌啤酒博物館/滑雪',
        mapQuery: '札幌啤酒博物館',
        activities: [
          { id: 801, time: '08:00', title: '滑雪或自由活動', type: 'spot', note: '若決定連滑兩天雪，這天就直接上雪場！若留在市區則走以下行程' },
          { id: 802, time: '10:00', title: '早餐/點心：Donguri 麵包店', location: 'Cocono Susukino 店', type: 'food', note: '推薦必嚐起司玉米麵包、竹輪麵包，炸雞也很推薦' },
          { id: 803, time: '11:30', title: '午餐待安排', location: '', type: 'food', note: '', mapUrl: '' },
          { id: 804, time: '14:30', title: '下午茶：Sorriso dell’ Orso', location: '義式雪糕店', type: 'food', note: '可以先試吃再挑選喜歡的口味，推薦品嚐香濃的焙茶口味' },
          { id: 805, time: '16:00', title: '札幌啤酒博物館', type: 'spot', note: '若時間充裕可前往參觀/喝手沖啤酒' },
          { id: 806, time: '19:00', title: '晚餐待找', location: '', type: 'food', note: '' }
        ]
      },
      {
        dayId: 9, date: '03/13', title: '市區回程',
        areaSummary: '札幌市區最後採買 🚆 新千歲機場CTS ✈️ 返家',
        mapQuery: '新千歲機場 CTS',
        activities: [
          { id: 901, time: '09:00', title: '最後市區採買', type: 'spot', note: '狸小路或札幌車站' },
          { id: 902, time: '12:00', title: '退房，前往新千歲機場', type: 'transport' },
          { id: 903, time: '14:00', title: '機場免稅店最後衝刺', type: 'spot' },
          { id: 904, time: '17:10', title: '搭機返家', type: 'flight' }
        ]
      },
      {
        dayId: 'E plan', date: 'eat', title: '食物備案都先放這',
        areaSummary: '札幌大通 / 薄野周邊精選咖啡甜點與咖哩',
        mapQuery: '札幌 大通',
        activities: [
          { id: 1001, time: '09:00', title: 'Smooch cafe', type: 'food', note: '咖啡廳', mapUrl: 'https://maps.app.goo.gl/zaD2s47n5AN6C5sM8' },
          { id: 1002, time: '10:00', title: '北大マルシェCafé&Labo', type: 'food', note: '咖啡廳', mapUrl: 'https://maps.app.goo.gl/S3EsPCBjrAvXLNpS8' },
          { id: 1003, time: '11:00', title: 'Soul Store Sapporo Odori', type: 'food', note: '咖哩', mapUrl: 'https://maps.app.goo.gl/mfDg4TTrXPhDZtgy5' },
          { id: 1004, time: '12:00', title: 'Sorriso dell’ Orso', type: 'food', note: '雪糕', mapUrl: 'https://maps.app.goo.gl/3hxvC8RUZF5V2Fd66' },
          // { id: 1005, time: '09:00', title: '', type: 'food', note: '咖啡廳', mapUrl: '' },
          // { id: 1006, time: '10:00', title: '', type: 'food', note: '咖啡廳', mapUrl: '' },
          // { id: 1007, time: '11:00', title: '', type: 'food', note: '咖啡廳', mapUrl: '' },
          // { id: 1008, time: '12:00', title: '', type: 'food', note: '咖啡廳', mapUrl: '' },
        ]
      },
      {
        dayId: 'S plan', date: 'shop', title: '購物其他清單',
        areaSummary: '札幌市區 / 狸小路推薦購物清單',
        mapQuery: '狸小路商店街 札幌',
        activities: [
          { id: 1101, time: '09:00', title: 'プロテイン専門店 エゾボリック 札幌大通店', type: 'spot', note: '運動營養補給品商店', mapUrl: 'https://maps.app.goo.gl/XTTy83AwoFB2AtZ37' },
          // { id: 1102, time: '10:00', title: '', type: 'spot', note: '', mapUrl: '' },
          // { id: 1103, time: '11:00', title: '', type: 'spot', note: '', mapUrl: '' },
          // { id: 1104, time: '12:00', title: '', type: 'spot', note: '', mapUrl: '' },
          // { id: 1105, time: '09:00', title: '', type: 'spot', note: '', mapUrl: '' },
          // { id: 1106, time: '10:00', title: '', type: 'spot', note: '', mapUrl: '' },
          // { id: 1107, time: '11:00', title: '', type: 'spot', note: '', mapUrl: '' },
          // { id: 1108, time: '12:00', title: '', type: 'spot', note: '', mapUrl: '' },
        ]
      }
    ];
  }
}
