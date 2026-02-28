/* View, Input and Interaction Wiring */

(function initUiModule(TV) {
    TV.switchView = function switchView(viewType) {
        const isJsonView = viewType === 'json';
        const treeContainer = document.getElementById('tree-container');
        const jsonContainer = document.getElementById('json-container');
        const visualBtn = document.getElementById('visualBtn');
        const jsonBtn = document.getElementById('jsonBtn');

        if (treeContainer) treeContainer.classList.toggle('hidden', isJsonView);
        if (jsonContainer) jsonContainer.classList.toggle('hidden', !isJsonView);
        if (visualBtn) visualBtn.classList.toggle('active', !isJsonView);
        if (jsonBtn) jsonBtn.classList.toggle('active', isJsonView);
    };

    TV.setupViewSwitcher = function setupViewSwitcher() {
        const jsonEditor = document.getElementById('json-editor');
        const updateTreeBtn = document.getElementById('updateTreeBtn');
        const visualBtn = document.getElementById('visualBtn');
        const jsonBtn = document.getElementById('jsonBtn');

        if (!jsonEditor || !updateTreeBtn || !visualBtn || !jsonBtn) return;

        jsonEditor.value = TV.state.currentTreeData ? JSON.stringify(TV.state.currentTreeData, null, 2) : '';

        visualBtn.addEventListener('click', () => TV.switchView('visual'));
        jsonBtn.addEventListener('click', () => TV.switchView('json'));
        visualBtn.classList.add('active');

        updateTreeBtn.addEventListener('click', () => {
            try {
                const jsonData = JSON.parse(jsonEditor.value);
                TV.state.currentTreeData = jsonData;
                TV.loadNewTree(jsonData);
                TV.showSuccess('树结构已更新');
            } catch (error) {
                TV.showError('JSON解析错误: ' + error.message);
            }
        });
    };

    TV.setupInputSwitch = function setupInputSwitch() {
        const inputToggle = document.getElementById('inputToggle');
        const inputLabel = document.getElementById('inputLabel');
        const fileUploadSection = document.getElementById('file-upload-section');
        const textInputSection = document.getElementById('text-input-section');

        if (!inputToggle || !inputLabel || !fileUploadSection || !textInputSection) return;

        inputToggle.addEventListener('change', function onInputChange() {
            const isTextInput = this.checked;
            fileUploadSection.classList.toggle('hidden', isTextInput);
            textInputSection.classList.toggle('hidden', !isTextInput);
            inputLabel.textContent = isTextInput ? '粘贴JSON' : '上传文件';
        });
    };

    TV.setupDragAndDrop = function setupDragAndDrop() {
        function handleDragOver(e) {
            e.preventDefault();
            e.stopPropagation();
            document.body.classList.add('drag-over');
        }

        function handleDragLeave(e) {
            e.preventDefault();
            e.stopPropagation();
            if (e.relatedTarget && !document.body.contains(e.relatedTarget)) {
                document.body.classList.remove('drag-over');
            }
        }

        function handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            document.body.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files || []).filter((f) => f.name.endsWith('.json'));
            if (files.length === 0) {
                TV.showError('请拖拽 JSON 文件');
                return;
            }

            TV.processFiles(files);
        }

        document.addEventListener('dragover', handleDragOver);
        document.addEventListener('dragleave', handleDragLeave);
        document.addEventListener('drop', handleDrop);
    };

    TV.setupKeyboardNavigation = function setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                TV.switchToPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                TV.switchToNext();
            }
        });
    };

    TV.syncPanCursorState = function syncPanCursorState() {
        const treeContainer = document.getElementById('tree-container');
        if (!treeContainer) return;

        treeContainer.classList.toggle('pan-mode', TV.state.isSpacePressed);
        treeContainer.classList.toggle('panning', TV.state.isPanning);
        document.body.classList.toggle('panning-tree', TV.state.isPanning);
    };

    TV.stopPanning = function stopPanning() {
        const state = TV.state;
        if (!state.isPanning) return;

        state.isPanning = false;
        if (state.panHasMoved) {
            state.suppressClickAfterPan = true;
        }

        TV.syncPanCursorState();
    };

    TV.setupTreeViewportInteractions = function setupTreeViewportInteractions() {
        const treeContainer = document.getElementById('tree-container');
        if (!treeContainer) return;

        treeContainer.addEventListener('wheel', (e) => {
            if (treeContainer.classList.contains('hidden')) return;
            if (!TV.state.currentTreeData) return;

            e.preventDefault();

            const state = TV.state;
            const oldZoom = state.treeZoom;
            const delta = e.deltaY < 0 ? TV.config.TREE_ZOOM_STEP : -TV.config.TREE_ZOOM_STEP;
            const nextZoom = TV.utils.clampZoom(oldZoom + delta);
            if (nextZoom === oldZoom) return;

            const containerRect = treeContainer.getBoundingClientRect();
            const offsetX = e.clientX - containerRect.left;
            const offsetY = e.clientY - containerRect.top;
            const anchorX = (treeContainer.scrollLeft + offsetX) / oldZoom;
            const anchorY = (treeContainer.scrollTop + offsetY) / oldZoom;

            TV.setTreeZoom(nextZoom);

            requestAnimationFrame(() => {
                treeContainer.scrollLeft = anchorX * nextZoom - offsetX;
                treeContainer.scrollTop = anchorY * nextZoom - offsetY;
            });
        }, { passive: false });

        treeContainer.addEventListener('mousedown', (e) => {
            const state = TV.state;
            if (!state.isSpacePressed || e.button !== 0) return;

            state.isPanning = true;
            state.panHasMoved = false;
            state.panStartX = e.clientX;
            state.panStartY = e.clientY;
            state.panStartScrollLeft = treeContainer.scrollLeft;
            state.panStartScrollTop = treeContainer.scrollTop;
            state.panStartWindowScrollY = window.scrollY;

            TV.syncPanCursorState();
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            const state = TV.state;
            if (!state.isPanning) return;

            const dx = e.clientX - state.panStartX;
            const dy = e.clientY - state.panStartY;

            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                state.panHasMoved = true;
            }

            treeContainer.scrollLeft = state.panStartScrollLeft - dx;
            treeContainer.scrollTop = state.panStartScrollTop - dy;

            if (treeContainer.scrollHeight <= treeContainer.clientHeight) {
                window.scrollTo({
                    top: Math.max(0, state.panStartWindowScrollY - dy),
                    behavior: 'auto'
                });
            }
        });

        treeContainer.addEventListener('click', (e) => {
            const state = TV.state;
            if (!state.suppressClickAfterPan) return;

            state.suppressClickAfterPan = false;
            e.preventDefault();
            e.stopPropagation();
        }, true);

        document.addEventListener('mouseup', () => {
            TV.stopPanning();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code !== 'Space') return;
            if (TV.utils.isEditableElement(e.target)) return;

            const state = TV.state;
            if (!state.isSpacePressed) {
                state.isSpacePressed = true;
                TV.syncPanCursorState();
            }

            e.preventDefault();
        });

        document.addEventListener('keyup', (e) => {
            if (e.code !== 'Space') return;

            const state = TV.state;
            state.isSpacePressed = false;
            TV.stopPanning();
            TV.syncPanCursorState();
        });

        window.addEventListener('blur', () => {
            const state = TV.state;
            state.isSpacePressed = false;
            TV.stopPanning();
            TV.syncPanCursorState();
        });
    };

    TV.initApp = function initApp(initialData) {
        const state = TV.state;

        state.currentTreeData = initialData;
        state.fileList.push(TV.createFileEntry('默认树', state.currentTreeData, 'default'));
        state.currentFileIndex = 0;

        TV.updateFileListUI();
        TV.updateNavButtons();
        TV.loadNewTree(state.currentTreeData);

        TV.setupDragAndDrop();
        TV.setupKeyboardNavigation();
        TV.setupViewSwitcher();
        TV.setupInputSwitch();
        TV.setupSortControls();
        TV.setupZoomControls();
        TV.setupTreeViewportInteractions();

        window.addEventListener('resize', () => {
            TV.drawLines();
        });
    };
})(window.TreeVis);
