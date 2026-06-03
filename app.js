class TaskManager {
    constructor() {
        this.TASK_KEY  = 'sf_tasks_only';
        this.COIN_KEY  = 'sf_coins_shared';
        this.DDAY_KEY  = 'sf_ddays';

        this.tasks   = JSON.parse(localStorage.getItem(this.TASK_KEY))  || [];
        this.coins   = parseInt(localStorage.getItem(this.COIN_KEY))    || 0;
        this.ddays   = JSON.parse(localStorage.getItem(this.DDAY_KEY))  || [];
        this.activeDdayId = null;

        this.currentFilterStatus = 'all';
        this.editMode            = false;
        this.selectedIds         = new Set();

        // 체크팝업 현재 열려있는 task id
        this._checkTargetId = null;
    }

      /* ─────────────────── MODAL (Add / Edit) ─────────────────── */
    openModal(taskId = null) {
        const modal = document.getElementById('task-modal');
        modal.classList.add('active');
        if (taskId) {
            const t = this.tasks.find(t => t.id == taskId);
            if (!t) return;
            document.getElementById('modal-title').textContent = '📝 일정 수정';
            document.getElementById('task-id').value       = t.id;
            document.getElementById('task-title').value    = t.title;
            document.getElementById('task-date').value     = t.date;
            document.getElementById('task-priority').value = t.priority;
            document.getElementById('task-category').value = t.category;
            document.getElementById('task-memo').value     = t.memo || '';
        } else {
            document.getElementById('modal-title').textContent = '📝 일정 추가';
            this.resetForm();
        }
    }

    closeModal() {
        document.getElementById('task-modal').classList.remove('active');
    }

    resetForm() {
        document.getElementById('task-id').value       = '';
        document.getElementById('task-title').value    = '';
        document.getElementById('task-date').value     = '';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-category').value = 'study';
        document.getElementById('task-memo').value     = '';
    }

    saveTask() {
        const id       = document.getElementById('task-id').value;
        const title    = document.getElementById('task-title').value.trim();
        const date     = document.getElementById('task-date').value;
        const priority = document.getElementById('task-priority').value;
        const category = document.getElementById('task-category').value;
        const memo     = document.getElementById('task-memo').value.trim();

        if (!title || !date) return alert('제목과 마감일을 입력해주세요.');

        if (id) {
            // 수정
            const t = this.tasks.find(t => t.id == id);
            if (t) { t.title = title; t.date = date; t.priority = priority; t.category = category; t.memo = memo; }
        } else {
            // 신규
            this.tasks.push({ id: Date.now(), title, date, priority, category, memo, status: 'before', result: null });
        }
        this.closeModal();
        this.save();
    }

    /* ─────────────────── DETAIL MODAL ─────────────────── */
    openDetailModal(id) {
        if (this.editMode) return; // Edit 모드에서는 열지 않음
        const t = this.tasks.find(t => t.id == id);
        if (!t) return;

        const catMap = { study: '학업', personal: '개인', team: '팀플', work: '업무' };
        const priMap = { high: '🔥 HIGH', medium: '⚡ MIDDLE', low: '🔽 LOW' };
        const daysLeft = this._daysLeft(t.date);

        document.getElementById('detail-modal-body').innerHTML = `
            <div class="detail-field"><label>제목</label><div class="detail-val" style="font-size:16px;font-weight:700;">${t.title}</div></div>
            <div class="detail-field"><label>마감일</label><div class="detail-val">📅 ${t.date} (D-${daysLeft < 0 ? 'Over' : daysLeft})</div></div>
            <div class="detail-field"><label>중요도</label><div class="detail-val">${priMap[t.priority]}</div></div>
            <div class="detail-field"><label>카테고리</label><div class="detail-val">${catMap[t.category]}</div></div>
            ${t.status === 'done' ? `<div class="detail-field"><label>결과</label><div class="detail-val">${t.result} 판정 완료</div></div>` : ''}
            <div class="detail-field"><label>세부 메모</label><div class="detail-memo-box">${t.memo || '(메모 없음)'}</div></div>
        `;

        document.getElementById('detail-edit-btn').onclick = () => {
            this.closeDetailModal();
            this.openModal(id);
        };

        document.getElementById('detail-modal').classList.add('active');
    }

    closeDetailModal() {
        document.getElementById('detail-modal').classList.remove('active');
    }

        /* ─────────────────── CHECK POPUP ─────────────────── */
    openCheckPopup(taskId, checkboxEl) {
        this._checkTargetId = taskId;
        const popup = document.getElementById('check-popup');
        const rect  = checkboxEl.getBoundingClientRect();
        popup.style.left = rect.right + 6 + 'px';
        popup.style.top  = rect.top + 'px';
        popup.classList.add('open');

        // 팝업 외부 클릭시 닫기
        setTimeout(() => {
            document.addEventListener('click', this._closeCheckPopupOutside, { once: true });
        }, 0);
    }

    _closeCheckPopupOutside = (e) => {
        const popup = document.getElementById('check-popup');
        if (!popup.contains(e.target)) {
            popup.classList.remove('open');
            this._checkTargetId = null;
        }
    };

    selectCheckOption(val) {
        const id = this._checkTargetId;
        if (!id) return;
        document.getElementById('check-popup').classList.remove('open');
        this.markTaskState(id, val);
    }

    markTaskState(id, clickType) {
        const task = this.tasks.find(t => t.id == id);
        if (!task) return;

        task.status = 'done';
        task.result = clickType;

        if (clickType === 'O' || clickType === 'triangle') {
            this.coins += 1;
        }
        this.save();
    }
