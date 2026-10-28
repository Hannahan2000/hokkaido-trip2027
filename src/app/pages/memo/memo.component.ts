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

  // 1. 宣告統一控管彈窗的設定
  modalConfig = {
    isOpen: false,
    mode: '', // 'clearAll' 或 'deleteOne'
    title: '',
    message: '',
    confirmText: ''
  };

  // 暫存準備要刪除的單筆筆記 ID
  targetMemoId: number | null = null;

  ngOnInit() {
    const saved = localStorage.getItem('hokkaido_memo');
    if (saved) {
      this.memos = JSON.parse(saved);
    }
  }

  addMemo(textarea: HTMLTextAreaElement) {
    const val = textarea.value.trim();
    if (val) {
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      this.memos.unshift({ id: Date.now(), text: val, date: dateStr });
      textarea.value = '';
      this.save();
    }
  }

  // 2. 觸發「單筆刪除」
  deleteMemo(id: number) {
    this.targetMemoId = id;
    this.modalConfig = {
      isOpen: true,
      mode: 'deleteOne',
      title: '確定要刪除這則筆記嗎？',
      message: '刪除後將無法復原。',
      confirmText: '確定刪除'
    };
  }

  // 3. 觸發「還原全部」
  clearStorage() {
    this.modalConfig = {
      isOpen: true,
      mode: 'clearAll',
      title: '確定要還原嗎？',
      message: '確定要還原所有自行輸入的筆記嗎？<br>（釘選的攻略不會受影響）',
      confirmText: '確定還原'
    };
  }

  // 4. 共用的關閉彈窗
  closeModal() {
    this.modalConfig.isOpen = false;
    this.targetMemoId = null;
  }

  // 5. 統一的執行樞紐
  executeModalAction() {
    if (this.modalConfig.mode === 'clearAll') {
      localStorage.removeItem('hokkaido_memo');
      this.memos = [];
    } else if (this.modalConfig.mode === 'deleteOne' && this.targetMemoId !== null) {
      this.memos = this.memos.filter(m => m.id !== this.targetMemoId);
      this.save();
    }
    this.closeModal();
  }

  save() {
    localStorage.setItem('hokkaido_memo', JSON.stringify(this.memos));
  }
}
