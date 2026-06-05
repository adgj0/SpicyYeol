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

    save() {
        localStorage.setItem(this.TASK_KEY, JSON.stringify(this.tasks));
        localStorage.setItem(this.COIN_KEY, this.coins);
        localStorage.setItem(this.DDAY_KEY, JSON.stringify(this.ddays));
        this.render();
        this.renderDdays();
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

    deleteTask(id) {
        if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;


        // 해당 id를 가진 일정을 배열에서 빼버림
        this.tasks = this.tasks.filter(t => t.id != id);

        this.closeDetailModal(); // 모달창 닫기
        this.save(); // 변경된 상태 저장 및 화면 갱신
    }

    /* ─────────────────── DETAIL MODAL ─────────────────── */
    openDetailModal(id) {
        if (this.editMode) return;
        const t = this.tasks.find(t => t.id == id);
        if (!t) return;

        const catMap = { study: '학업', personal: '개인', team: '팀플', work: '업무' };
        const priMap = { high: '🔥 HIGH', medium: '⚡ MIDDLE', low: '🔽 LOW' };
        const daysLeft = this._daysLeft(t.date);

        // 💡 결과 텍스트 변환 로직
        let resText = '';
        if (t.result === 'O') resText = '성공';
        else if (t.result === 'X') resText = '실패';

        document.getElementById('detail-modal-body').innerHTML = `
            <div class="detail-field"><label>제목</label><div class="detail-val" style="font-size:16px;font-weight:700;">${t.title}</div></div>
            <div class="detail-field"><label>마감일</label><div class="detail-val">📅 ${t.date} (D-${daysLeft < 0 ? 'Over' : daysLeft})</div></div>
            <div class="detail-field"><label>중요도</label><div class="detail-val">${priMap[t.priority]}</div></div>
            <div class="detail-field"><label>카테고리</label><div class="detail-val">${catMap[t.category]}</div></div>
            ${t.status === 'done' && resText ? `<div class="detail-field"><label>결과</label><div class="detail-val">${resText}</div></div>` : ''}
            <div class="detail-field"><label>세부 메모</label><div class="detail-memo-box">${t.memo || '(메모 없음)'}</div></div>
        `;


        document.getElementById('detail-edit-btn').onclick = () => {
            this.closeDetailModal();
            this.openModal(id);
        };

        document.getElementById('detail-delete-btn').onclick = () => {
            this.deleteTask(id);
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

        if (clickType === '진행 중') {
            // '진행 중'을 누르면 다시 원래 상태로 되돌림
            task.status = 'in_progress';
            task.result = null;
        } else {
            // O, X, 세모를 누르면 완료 처리
            task.status = 'done';
            task.result = clickType;

            // O나 세모일 때만 코인 추가
            if (clickType === 'O' || clickType === 'triangle') {
                this.coins += 1;
            }
        }
        this.save();
    }


        /* ─────────────────── FILTER STATUS ─────────────────── */
    setFilterStatus(status) {
        this.currentFilterStatus = status;
        document.querySelectorAll('.sub-tab').forEach((el, idx) => {
            el.classList.toggle('active',
                (status === 'all'        && idx === 0) ||
                (status === 'in_progress' && idx === 1) ||
                (status === 'done'       && idx === 2)
            );
        });
        this.render();
    }

        /* ─────────────────── EDIT MODE ─────────────────── */
    toggleEditMode() {
        this.editMode = !this.editMode;
        this.selectedIds.clear();

        const btn = document.getElementById('btn-edit-mode');
        const bar = document.getElementById('edit-action-bar');

        btn.classList.toggle('active', this.editMode);
        bar.style.display = this.editMode ? 'flex' : 'none';
        this._updateSelectedCount();
        this.render();
    }

    toggleSelectTask(id) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        this._updateSelectedCount();
        this.render();
    }

    _updateSelectedCount() {
        document.getElementById('selected-count').textContent = this.selectedIds.size;
    }


       /* ─────────────────── POSTPONE ─────────────────── */
    openPostponeModal() {
        if (this.selectedIds.size === 0) return alert('미룰 일정을 선택해주세요.');
        document.getElementById('postpone-modal').classList.add('active');
    }

    closePostponeModal() {
        document.getElementById('postpone-modal').classList.remove('active');
    }

    applyPostpone() {
        const newDate = document.getElementById('postpone-date').value;
        if (!newDate) return alert('날짜를 선택해주세요.');

        this.selectedIds.forEach(id => {
            const t = this.tasks.find(t => t.id == id);
            if (t) { t.date = newDate; t.status = 'before'; t.result = null; }
        });

        this.selectedIds.clear();
        this.closePostponeModal();
        this.toggleEditMode(); // Edit 모드 종료
        this.save();
    }

    /* ─────────────────── D-DAY ─────────────────── */
    initDday() {
        const setBtn    = document.getElementById('dday-set-btn');
        const dropdown  = document.getElementById('dday-dropdown');
        const cancelBtn = document.getElementById('dday-cancel-btn');
        const saveBtn   = document.getElementById('dday-save-btn');

        setBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        cancelBtn.addEventListener('click', () => {
            dropdown.classList.remove('open');
            document.getElementById('dday-name-input').value = '';
            document.getElementById('dday-date-input').value = '';
        });

        saveBtn.addEventListener('click', () => {
            const name = document.getElementById('dday-name-input').value.trim();
            const date = document.getElementById('dday-date-input').value;
            if (!name || !date) return alert('이름과 날짜를 모두 입력해주세요.');

            this.ddays.push({ id: Date.now(), name, date });
            document.getElementById('dday-name-input').value = '';
            document.getElementById('dday-date-input').value = '';

            if (this.ddays.length === 1) this.activeDdayId = this.ddays[0].id;
            this.save();
        });

        // 외부 클릭시 닫기
        document.addEventListener('click', (e) => {
            const widget = document.getElementById('dday-widget');
            if (!widget.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }

    renderDdays() {
        const list = document.getElementById('dday-list');
        list.innerHTML = '';

        this.ddays.forEach(d => {
            const daysLeft = this._daysLeft(d.date);
            const item = document.createElement('div');
            item.className = `dday-item${this.activeDdayId === d.id ? ' active-dday' : ''}`;
            item.innerHTML = `
                <span class="dday-item-name">${d.name}</span>
                <span class="dday-item-val">D-${daysLeft < 0 ? Math.abs(daysLeft) + '(지남)' : daysLeft}</span>
                <button class="dday-item-del" data-id="${d.id}" title="삭제">✕</button>
            `;

            // 선택
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('dday-item-del')) return;
                this.activeDdayId = d.id;
                this.renderDdays();
                this._updateDdayWidget();
            });

            // 삭제
            item.querySelector('.dday-item-del').addEventListener('click', (e) => {
                e.stopPropagation();
                this.ddays = this.ddays.filter(x => x.id !== d.id);
                if (this.activeDdayId === d.id) this.activeDdayId = this.ddays[0]?.id || null;
                this.save();
            });

            list.appendChild(item);
        });

        this._updateDdayWidget();
    }

    _updateDdayWidget() {
        const info = document.getElementById('dday-info');
        const active = this.ddays.find(d => d.id === this.activeDdayId);
        if (active) {
            const dl = this._daysLeft(active.date);
            info.innerHTML = `
                <span class="dday-name">${active.name}</span>
                <span class="dday-value">D-${dl < 0 ? Math.abs(dl) + '(지남)' : dl}</span>
            `;
        } else {
            info.innerHTML = `<span class="dday-label">D-Day 설정</span>`;
        }
    }

 /* ─────────────────── HELPERS ─────────────────── */
    _daysLeft(dateStr) {
        const now   = new Date(); now.setHours(0,0,0,0);
        const due   = new Date(dateStr);
        return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    }

    /* ─────────────────── RENDER ─────────────────── */
    render() {
        document.getElementById('coin-count').innerText = this.coins;

        const lists = {
            high:   document.getElementById('list-high'),
            medium: document.getElementById('list-medium'),
            low:    document.getElementById('list-low'),
        };
        Object.values(lists).forEach(el => el.innerHTML = '');

        const selectedCategory = document.getElementById('filter-category').value;
        const catMap = { study: '학업', personal: '개인', team: '팀플', work: '업무' };

        /* ── URGENT BANNERS ── */
        const red7   = [];
        const yellow10 = [];

        this.tasks.forEach(task => {
            if (task.status === 'done') return;
            const dl = this._daysLeft(task.date);
            if (dl >= 0 && dl <= 7)  red7.push({ ...task, dl });
            else if (dl >= 0 && dl <= 10) yellow10.push({ ...task, dl });
        });

        // 가까운 순 정렬
        red7.sort((a, b) => a.dl - b.dl);
        yellow10.sort((a, b) => a.dl - b.dl);

        const bannersEl = document.getElementById('urgent-banners');
        bannersEl.innerHTML = '';

        // 빨간 배너 (D-7)
        if (red7.length) {
            const div = document.createElement('div');
            div.className = 'banner banner-red';
            div.innerHTML = `
                <div class="banner-tasks-list">
                    ${red7.map(t => `
                        <div class="banner-task-chip">
                            <span>${t.title}</span>
                            <span class="banner-task-d">D-${t.dl}</span>
                        </div>
                    `).join('')}
                </div>
                <span class="banner-icon-big">🚨</span>
            `;
            bannersEl.appendChild(div);
        }

        // 노란 배너 (D-10 ~ D-8)
        if (yellow10.length) {
            const div = document.createElement('div');
            div.className = 'banner banner-yellow';
            div.innerHTML = `
                <div class="banner-tasks-list">
                    ${yellow10.map(t => `
                        <div class="banner-task-chip">
                            <span>${t.title}</span>
                            <span class="banner-task-d">D-${t.dl}</span>
                        </div>
                    `).join('')}
                </div>
                <span class="banner-icon-big">⚠️</span>
            `;
            bannersEl.appendChild(div);
        }

/* ── TASK LIST ── */
        this.tasks.forEach(task => {
            const dl = this._daysLeft(task.date);

            // 필터
           // 필터 (To-Do, 진행 중, 완료를 명확하게 3단계로 분리)
            if (this.currentFilterStatus === 'all' && task.status !== 'before') return;
            if (this.currentFilterStatus === 'in_progress' && task.status !== 'in_progress') return;
            if (this.currentFilterStatus === 'done' && task.status !== 'done') return;
            if (selectedCategory !== 'all' && task.category !== selectedCategory)       return;

            const li = document.createElement('li');
            const isDone   = task.status === 'done';
            const isFailed = isDone && task.result === 'X';
            li.className = `task-card ${isDone ? (isFailed ? 'failed-item' : 'done-item') : ''} ${this.selectedIds.has(task.id) ? 'selected-card' : ''}`;

            // 체크박스 상태 클래스
           let cbClass = '';
            if (task.result === 'O')        cbClass = 'checked-O';
            else if (task.result === 'triangle') cbClass = 'checked-triangle';
            else if (task.result === 'X')   cbClass = 'checked-X';

            const cbContent = task.result === 'O' ? 'O' : task.result === 'triangle' ? '△' : task.result === 'X' ? 'X' : '';

            let resultText = '';
            if (task.result === 'O') resultText = '성공';
            else if (task.result === 'X') resultText = '실패';

            li.innerHTML = `
                ${this.editMode ? `
                    <div class="multi-select-circle ${this.selectedIds.has(task.id) ? 'checked' : ''}"
                         data-id="${task.id}">
                         ${this.selectedIds.has(task.id) ? '✓' : ''}
                    </div>
                ` : ''}
                <div class="task-checkbox ${cbClass}" data-id="${task.id}">${cbContent}</div>
                <div class="task-left-core">
                    <span class="badge-cat">${catMap[task.category]}</span>
                    <span class="task-title-text">${task.title}</span>
                    <span class="task-meta">D-${dl < 0 ? 'Over' : dl}</span>
                </div>
                ${isDone && resultText !== '' ? `<span class="task-done-label">${resultText}</span>` : ''}
            `;

            // 체크박스 클릭 → 팝업
            const cb = li.querySelector('.task-checkbox');
            cb.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.editMode) return;
                if (isDone) return; // 완료된 건 재판정 불가
                this.openCheckPopup(task.id, cb);
            });

            // 다중선택 원형 클릭
            if (this.editMode) {
                const circle = li.querySelector('.multi-select-circle');
                circle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSelectTask(task.id);
                });
            }

            // 카드 클릭 → 상세보기 (Edit 모드 아닐 때)
            li.addEventListener('click', (e) => {
                if (this.editMode) {
                    this.toggleSelectTask(task.id);
                    return;
                }
                // 체크박스 클릭이 아닌 경우 상세보기
                if (!e.target.classList.contains('task-checkbox')) {
                    this.openDetailModal(task.id);
                }
            });

            if (lists[task.priority]) lists[task.priority].appendChild(li);
        });
    }
}

/* ───────────────────── INIT ───────────────────── */
const app = new TaskManager();

window.onload = () => {
    app.render();
    app.initDday();
    app.renderDdays();

    // Check popup 버튼 이벤트
    document.querySelectorAll('.check-opt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            app.selectCheckOption(btn.dataset.val);
        });
    });
};
