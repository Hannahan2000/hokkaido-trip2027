import { Component, OnInit } from '@angular/core';

interface Memo {
  id: number;
  text: string;
  date: string;
}

@Component({
  selector: 'app-memo',
  templateUrl: './memo.component.html',
  styleUrls: ['./memo.component.scss']
})
export class MemoComponent implements OnInit {
  memos: Memo[] = [];

  ngOnInit() {
    // 進入頁面時載入之前的筆記
    const saved = localStorage.getItem('hokkaido_memo');
    if (saved) {
      this.memos = JSON.parse(saved);
    }
  }

  // 新增筆記
  addMemo(textarea: HTMLTextAreaElement) {
    const val = textarea.value.trim();
    if (val) {
      const now = new Date();
      // 格式化時間 (例如: 3/5 14:30)
      const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      this.memos.unshift({ id: Date.now(), text: val, date: dateStr });
      textarea.value = ''; // 清空輸入框
      this.save();
    }
  }

  // 刪除筆記
  deleteMemo(id: number) {
    this.memos = this.memos.filter(m => m.id !== id);
    this.save();
  }

  // 存檔到 LocalStorage
  save() {
    localStorage.setItem('hokkaido_memo', JSON.stringify(this.memos));
  }
}
