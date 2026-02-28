/* File List, Upload, Sort and Navigation */

(function initFilesModule(TV) {
    TV.createFileEntry = function createFileEntry(name, data, type) {
        const state = TV.state;
        return {
            id: ++state.fileIdCounter,
            name,
            data,
            type,
            addedAt: Date.now() + state.fileIdCounter
        };
    };

    TV.getCurrentFileId = function getCurrentFileId() {
        const state = TV.state;
        if (state.currentFileIndex < 0 || state.currentFileIndex >= state.fileList.length) return null;
        return state.fileList[state.currentFileIndex].id;
    };

    TV.getFileIndexById = function getFileIndexById(fileId) {
        return TV.state.fileList.findIndex((file) => file.id === fileId);
    };

    TV.applySort = function applySort(mode, keepCurrent) {
        const state = TV.state;
        const keep = keepCurrent !== false;
        const activeFileId = keep ? TV.getCurrentFileId() : null;
        state.currentSortMode = mode;

        if (mode === 'name') {
            state.fileList.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }));
        } else if (mode === 'time') {
            state.fileList.sort((a, b) => a.addedAt - b.addedAt);
        }

        if (keep && activeFileId !== null) {
            const newIndex = TV.getFileIndexById(activeFileId);
            if (newIndex >= 0) {
                state.currentFileIndex = newIndex;
            }
        }
    };

    TV.setupSortControls = function setupSortControls() {
        const sortMode = document.getElementById('sortMode');
        const sortHint = document.getElementById('sortHint');
        if (!sortMode || !sortHint) return;

        sortMode.value = TV.state.currentSortMode;
        sortHint.textContent = '手动模式：可拖动条目调整顺序';

        sortMode.addEventListener('change', function onSortChange() {
            TV.applySort(this.value, true);
            sortHint.textContent = this.value === 'manual'
                ? '手动模式：可拖动条目调整顺序'
                : this.value === 'name'
                    ? '当前按文件名自动排序'
                    : '当前按上传时间自动排序';

            TV.updateFileListUI();
            TV.updateNavButtons();
        });
    };

    TV.handleFileUpload = function handleFileUpload(event) {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        TV.processFiles(files);
        event.target.value = '';
    };

    TV.processFiles = function processFiles(files) {
        const state = TV.state;
        let successCount = 0;
        let failCount = 0;
        let processedCount = 0;
        const newFileIds = [];

        files.forEach((file) => {
            const reader = new FileReader();

            reader.onload = function onload(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    const entry = TV.createFileEntry(file.name, jsonData, 'file');
                    state.fileList.push(entry);
                    newFileIds.push(entry.id);
                    successCount++;
                } catch (_err) {
                    failCount++;
                }

                processedCount++;
                checkComplete();
            };

            reader.onerror = function onerror() {
                failCount++;
                processedCount++;
                checkComplete();
            };

            reader.readAsText(file);
        });

        function checkComplete() {
            if (processedCount !== files.length) return;

            TV.applySort(state.currentSortMode, true);
            TV.updateFileListUI();

            if (successCount > 0) {
                const firstNewIndex = TV.getFileIndexById(newFileIds[0]);
                if (firstNewIndex >= 0) {
                    TV.switchToFile(firstNewIndex);
                }
                TV.showSuccess('成功加载 ' + successCount + ' 个文件');
            }

            if (failCount > 0) {
                TV.showError(failCount + ' 个文件加载失败');
            }
        }
    };

    TV.handleTextInput = function handleTextInput() {
        const textEl = document.getElementById('json-text');
        if (!textEl) return;

        const text = textEl.value.trim();
        if (!text) {
            TV.showError('请输入 JSON 数据');
            return;
        }

        try {
            const jsonData = JSON.parse(text);
            const timestamp = new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const entry = TV.createFileEntry('粘贴的数据 ' + timestamp, jsonData, 'pasted');
            TV.state.fileList.push(entry);

            const newFileId = entry.id;
            TV.applySort(TV.state.currentSortMode, true);
            const newIndex = TV.getFileIndexById(newFileId);

            TV.updateFileListUI();
            if (newIndex >= 0) {
                TV.switchToFile(newIndex);
            }

            textEl.value = '';
            TV.showSuccess('已添加到列表');
        } catch (err) {
            TV.showError('JSON 解析错误: ' + err.message);
        }
    };

    TV.switchToFile = function switchToFile(index) {
        const state = TV.state;
        if (index < 0 || index >= state.fileList.length) return;

        state.currentFileIndex = index;
        state.currentTreeData = state.fileList[index].data;

        TV.loadNewTree(state.currentTreeData);
        TV.updateFileListUI();
        TV.updateNavButtons();
    };

    TV.switchToPrev = function switchToPrev() {
        const state = TV.state;
        if (state.currentFileIndex > 0) {
            TV.switchToFile(state.currentFileIndex - 1);
        }
    };

    TV.switchToNext = function switchToNext() {
        const state = TV.state;
        if (state.currentFileIndex < state.fileList.length - 1) {
            TV.switchToFile(state.currentFileIndex + 1);
        }
    };

    TV.updateNavButtons = function updateNavButtons() {
        const state = TV.state;
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const currentIndex = document.getElementById('currentIndex');
        const totalFiles = document.getElementById('totalFiles');

        if (prevBtn) prevBtn.disabled = state.currentFileIndex <= 0;
        if (nextBtn) nextBtn.disabled = state.currentFileIndex >= state.fileList.length - 1;
        if (currentIndex) currentIndex.textContent = state.fileList.length > 0 ? state.currentFileIndex + 1 : 0;
        if (totalFiles) totalFiles.textContent = state.fileList.length;
    };

    TV.updateFileListUI = function updateFileListUI() {
        const state = TV.state;
        const listContainer = document.getElementById('file-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (state.fileList.length === 0) {
            const emptyTip = document.createElement('div');
            emptyTip.className = 'file-list-empty';
            emptyTip.innerHTML = '暂无树数据<br>请上传或粘贴 JSON';
            listContainer.appendChild(emptyTip);
            return;
        }

        state.fileList.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item' + (index === state.currentFileIndex ? ' active' : '');
            item.dataset.fileId = String(file.id);
            item.onclick = (e) => {
                if (!e.target.closest('.remove-btn')) {
                    TV.switchToFile(index);
                }
            };

            const icon = file.type === 'file' ? '📄' : file.type === 'pasted' ? '📋' : '🌲';
            const dragHandle = state.currentSortMode === 'manual'
                ? '<span class="drag-handle" title="拖动排序">⋮⋮</span>'
                : '';

            item.innerHTML = dragHandle +
                '<span class="file-icon">' + icon + '</span>' +
                '<span class="file-name">' + file.name + '</span>' +
                '<button class="remove-btn" title="移除">×</button>';

            if (state.currentSortMode === 'manual') {
                item.draggable = true;
                item.addEventListener('dragstart', TV.handleFileDragStart);
                item.addEventListener('dragover', TV.handleFileDragOver);
                item.addEventListener('dragleave', TV.handleFileDragLeave);
                item.addEventListener('drop', TV.handleFileDrop);
                item.addEventListener('dragend', TV.handleFileDragEnd);
            }

            const removeBtn = item.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    TV.removeFile(index);
                };
            }

            listContainer.appendChild(item);
        });
    };

    TV.handleFileDragStart = function handleFileDragStart(e) {
        TV.state.draggedFileId = Number(this.dataset.fileId);
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };

    TV.handleFileDragOver = function handleFileDragOver(e) {
        e.preventDefault();
        this.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
    };

    TV.handleFileDragLeave = function handleFileDragLeave() {
        this.classList.remove('drag-over');
    };

    TV.handleFileDrop = function handleFileDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        const state = TV.state;
        const targetFileId = Number(this.dataset.fileId);
        if (!state.draggedFileId || state.draggedFileId === targetFileId) return;

        const fromIndex = TV.getFileIndexById(state.draggedFileId);
        const toIndex = TV.getFileIndexById(targetFileId);
        if (fromIndex < 0 || toIndex < 0) return;

        const activeFileId = TV.getCurrentFileId();
        const moved = state.fileList.splice(fromIndex, 1)[0];
        state.fileList.splice(toIndex, 0, moved);

        if (activeFileId !== null) {
            state.currentFileIndex = TV.getFileIndexById(activeFileId);
        }

        TV.updateFileListUI();
        TV.updateNavButtons();
    };

    TV.handleFileDragEnd = function handleFileDragEnd() {
        TV.state.draggedFileId = null;
        document.querySelectorAll('.file-item').forEach((item) => {
            item.classList.remove('dragging');
            item.classList.remove('drag-over');
        });
    };

    TV.removeFile = function removeFile(index) {
        const state = TV.state;
        if (index < 0 || index >= state.fileList.length) return;

        const removedCurrent = state.currentFileIndex === index;
        state.fileList.splice(index, 1);

        if (state.fileList.length === 0) {
            state.currentFileIndex = -1;
            state.currentTreeData = null;
            TV.renderEmptyState();
            TV.updateFileListUI();
            TV.updateNavButtons();
            TV.showSuccess('列表已清空，请上传或粘贴 JSON');
            return;
        }

        if (state.currentFileIndex > index) {
            state.currentFileIndex--;
        } else if (removedCurrent) {
            state.currentFileIndex = Math.min(index, state.fileList.length - 1);
        }

        state.currentTreeData = state.fileList[state.currentFileIndex].data;
        TV.loadNewTree(state.currentTreeData);
        TV.updateFileListUI();
        TV.updateNavButtons();
    };
})(window.TreeVis);
