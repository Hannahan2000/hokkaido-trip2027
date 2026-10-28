import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html'
})
export class ConfirmModalComponent {
  // 控制彈窗是否顯示
  @Input() isOpen: boolean = false;

  // 允許客製化彈窗文字，並給予預設值
  @Input() title: string = '確定要執行嗎？';
  @Input() message: string = '此動作無法復原。';
  @Input() confirmText: string = '確定';
  @Input() cancelText: string = '取消';

  // 傳遞事件給父元件
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
