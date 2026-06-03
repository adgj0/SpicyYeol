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

    markTaskState(id, clickType) {
        const task = this.tasks.find(t => t.id == id);
        if(!task) return;

        task.status = 'done';
        task.result = clickType;

        if (clickType === 'O' || clickType === 'triangle') {
            this.coins += 1;
        }
        this.save();
    }

    setFilterStatus(status) {
        this.currentFilterStatus = status;
        document.querySelectorAll('.sub-tab').forEach((el, idx) => {
            el.classList.toggle('active',
                (status === 'all' && idx === 0) ||
                (status === 'in_progress' && idx === 1) ||
                (status === 'done' && idx === 2)
            );
        });
        this.render();
    }

    render() {
        document.getElementById('coin-count').innerText = this.coins;

        const lists = { high: document.getElementById('list-high'), medium: document.getElementById('list-medium'), low: document.getElementById('list-low') };
        Object.values(lists).forEach(el => el.innerHTML = '');

        const selectedCategory = document.getElementById('filter-category').value;
        let d7Count = 0;

        this.tasks.forEach(task => {
            const timeDiff = new Date(task.date) - new Date();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            if(task.status !== 'done' && daysLeft <= 7 && daysLeft >= 0) d7Count++;

            // 💡 3단 필터 로직 완벽 복구
            if (this.currentFilterStatus === 'in_progress' && task.status !== 'before') return;
            if (this.currentFilterStatus === 'done' && task.status !== 'done') return;
            if (this.currentFilterStatus === 'all' && task.status === 'done') return;
            if (selectedCategory !== 'all' && task.category !== selectedCategory) return;

            const li = document.createElement('li');
            li.className = `task-card ${task.status === 'done' ? (task.result === 'X' ? 'failed-item' : 'done-item') : ''}`;

            const catMap = { study: '학업', personal: '개인', team: '팀플', work: '업무' };

            li.innerHTML = `
                <div class="task-left-core">
                    <span class="badge-cat">${catMap[task.category]}</span>
                    <span class="task-title-text">${task.result === 'X' ? '[실패] ' : ''}${task.title} (D-${daysLeft < 0 ? 'Over' : daysLeft})</span>
                </div>
                ${task.status !== 'done' ? `
                    <div class="state-selectors">
                        <button class="btn-state" onclick="app.markTaskState(${task.id}, 'O')">O</button>
                        <button class="btn-state" onclick="app.markTaskState(${task.id}, 'triangle')">△</button>
                        <button class="btn-state" onclick="app.markTaskState(${task.id}, 'X')">X</button>
                    </div>
                ` : `<span style="font-weight:bold; font-size:13px; color:#888;">${task.result} 판정 완료</span>`}
            `;

            if (lists[task.priority]) lists[task.priority].appendChild(li);
        });

        document.getElementById('red-banner-count').innerText = d7Count;
    }
}

const app = new TaskManager();
window.onload = () => app.render();