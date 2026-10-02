import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Hotel {
  id: number;
  name: string;
  city: string;
  dates: string;
  nights: number;
  checkIn: string;
  checkOut: string;
  address: string;
  phone: string;
  mapUrl: string;
  iframeUrl: string;
  img: string;
  note: string;
}

@Component({
  selector: 'app-hotel',
  templateUrl: './hotel.component.html',
  styleUrls: ['./hotel.component.scss']
})
export class HotelComponent {
  hotels: Hotel[] = [
    {
      id: 1,
      name: 'Solaria Nishitetsu Hotel',
      city: '札幌',
      dates: '03/05 (五) - 03/08 (一)',
      nights: 3,
      checkIn: '15:00',
      checkOut: '11:00',
      address: '北海道札幌市中央區北4条西5丁目1-2',
      phone: '+81 11-208-5555',
      mapUrl: 'https://maps.app.goo.gl/ebj65qHzPa3ma9HW8',
      iframeUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2914.9142462168056!2d141.34184617656078!3d43.06427109032102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f0b299fdb429e27%3A0x6389691adae7f61f!2z57Si5ouJ5Yip5Lqe6KW_6ZC16aOv5bqXIOacreW5jA!5e0!3m2!1szh-TW!2stw!4v1790657808333!5m2!1szh-TW!2stw',
      img: 'assets/img/solaria.png',
      note: '札幌站旁'
    },
    {
      id: 2,
      name: 'The Lake Suite 湖之栖',
      city: '洞爺湖',
      dates: '03/08 (一) - 03/09 (二)',
      nights: 1,
      checkIn: '16:00',
      checkOut: '11:00',
      address: '北海道虻田郡洞爺湖町洞爺湖溫泉7-1',
      phone: '+81 142-82-4121',
      mapUrl: 'https://maps.app.goo.gl/vjcHeVtjewMbN3Bo8',
      iframeUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2938.517938786892!2d140.83059747654107!3d42.5655279220953!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f9fe363e8545499%3A0x7c9d7c77a6a2014f!2sThe%20Lake%20Suite%20Ko%20No%20Sumika!5e0!3m2!1szh-TW!2stw!4v1790657886949!5m2!1szh-TW!2stw',
      img: 'assets/img/the_lake_suite.png',
      note: '露台房+溫泉露天風呂 (含早晚餐)'
    },
    {
      id: 3,
      name: 'Granbell札幌酒店',
      city: '札幌',
      dates: '03/09 (二) - 03/13 (六)',
      nights: 4,
      checkIn: '15:00',
      checkOut: '11:00',
      address: '北海道札幌市中央區南3条西8丁目10-1',
      phone: '+81 11-522-5541',
      mapUrl: 'https://maps.app.goo.gl/9YQGxmjyvmZeG9xQA',
      iframeUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5829.298993845367!2d141.3575334!3d43.0698388!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f0b290072bb871f%3A0x920b344584e8febe!2sSAPPORO%20HOTEL%20by%20GRANBELL!5e0!3m2!1szh-TW!2stw!4v1790658412175!5m2!1szh-TW!2stw',
      img: 'assets/img/granbell.png',
      note: '大通/薄野生活圈，滑雪及採買方便'
    }
  ];

  selectedHotel: Hotel | null = null;
  isSheetOpen = false;
  touchStartY = 0;

  constructor(private sanitizer: DomSanitizer) {}

  // 4. 建立轉換安全網址的方法
  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // 打開飯店詳細面板
  openDetail(hotel: Hotel) {
    this.selectedHotel = hotel;
    // 延遲一點點讓 DOM 先生出元件，再觸發 CSS 滑入動畫
    setTimeout(() => {
      this.isSheetOpen = true;
    }, 10);
  }

// 2. 加入手指剛碰到螢幕的事件
  onTouchStart(event: TouchEvent): void {
    this.touchStartY = event.changedTouches[0].screenY;
  }

  // 3. 加入手指離開螢幕的計算事件
  onTouchEnd(event: TouchEvent): void {
    const touchEndY = event.changedTouches[0].screenY;
    const swipeDistance = touchEndY - this.touchStartY;

    // 如果向下滑動超過 50px，就觸發你的關閉函式
    if (swipeDistance > 50) {
      this.closeDetail();
    }
  }

  // 4. 確保你原本的關閉函式會把 isSheetOpen 設為 false
  closeDetail(): void {
    this.isSheetOpen = false;

    // 記得要等待動畫 (300ms) 跑完，再把資料清空，這樣才會有平滑下降的過場
    setTimeout(() => {
      this.selectedHotel = null;
    }, 300);
  }
}
