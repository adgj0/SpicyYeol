class TaskManager {
    constructor() {
        this.TASK_KEY = 'sf_tasks_only';
        this.COIN_KEY = 'sf_coins_shared';

        this.tasks = JSON.parse(localStorage.getItem(this.TASK_KEY)) || [];
        this.coins = parseInt(localStorage.getItem(this.COIN_KEY)) || 0;
        this.currentFilterStatus = 'all';
    }

    save() {
        localStorage.setItem(this.TASK_KEY, JSON.stringify(this.tasks));
        localStorage.setItem(this.COIN_KEY, this.coins);
        this.render();
    }

    openModal() {
        document.getElementById('task-modal').classList.add('active');
        this.resetForm();
    }

    closeModal() {
        document.getElementById('task-modal').classList.remove('active');
    }

    resetForm() {
        document.getElementById('task-id').value = '';
        document.getElementById('task-title').value = '';
        document.getElementById('task-date').value = '';
    }

    saveTask() {
        const title = document.getElementById('task-title').value;
        const date = document.getElementById('task-date').value;
        const priority = document.getElementById('task-priority').value;
        const category = document.getElementById('task-category').value;

        if (!title || !date) return alert("제목과 마감일을 입력해주세요.");

        this.tasks.push({ id: Date.now(), title, date, priority, category, status: 'before', result: null });
        this.closeModal();
        this.save();
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