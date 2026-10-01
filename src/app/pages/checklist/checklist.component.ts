import { Component, OnInit } from '@angular/core';

interface CheckItem {
  id: number;
  text: string;
  done: boolean;
}

@Component({
  selector: 'app-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss']
})
export class ChecklistComponent implements OnInit {
  items: CheckItem[] = [];

  ngOnInit() {
    // 進入頁面時，先檢查瀏覽器有沒有之前的存檔
    const saved = localStorage.getItem('hokkaido_checklist');
    if (saved) {
      this.items = JSON.parse(saved);
    } else {
      // 如果沒有存檔，就載入預設的北海道必備清單
      this.items = [
        { id: 1, text: '護照', done: false },
        { id: 2, text: '日幣現金/信用卡', done: false },
        { id: 3, text: '禦寒外套/發熱衣物', done: false },
        { id: 4, text: '行動電源與充電線/轉接頭', done: false },
        { id: 5, text: 'eSIM', done: false },
        { id: 6, text: '牙刷牙膏小毛巾等盥洗用品', done: false },
        { id: 7, text: '化妝保養品', done: false },
        { id: 8, text: '簡便8天衣物', done: false },
      ];
      this.save();
    }
  }

  // 切換打勾狀態
  toggle(item: CheckItem) {
    item.done = !item.done;
    this.save();
  }

  // 新增物品
  add(inputElement: HTMLInputElement) {
    const val = inputElement.value.trim();
    if (val) {
      this.items.unshift({ id: Date.now(), text: val, done: false }); // 新增在最上方
      inputElement.value = ''; // 清空輸入框
      this.save();
    }
  }

  // 刪除物品
  delete(item: CheckItem, event: Event) {
    event.stopPropagation(); // 防止觸發到外層的打勾點擊事件
    this.items = this.items.filter(i => i.id !== item.id);
    this.save();
  }

  // 存檔到 LocalStorage
  save() {
    localStorage.setItem('hokkaido_checklist', JSON.stringify(this.items));
  }

  // 計算完成度百分比 (供進度條使用)
  get progress() {
    if (!this.items.length) return 0;
    const doneCount = this.items.filter(i => i.done).length;
    return Math.round((doneCount / this.items.length) * 100);
  }
}
