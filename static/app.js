/* Tree Visualization Application JavaScript */

// Global variables
let svgElement = null;
let currentTreeData = null;
let fileList = [];
let currentFileIndex = -1;
let fileIdCounter = 0;
let currentSortMode = 'manual';
let draggedFileId = null;

// Initialize the application
function initApp(initialData) {
    currentTreeData = initialData;

    // Add default tree (can be removed like any other file)
    fileList.push(createFileEntry("默认树", currentTreeData, "default"));
    currentFileIndex = 0;

    // Initialize UI
    updateFileListUI();
    updateNavButtons();
    loadNewTree(currentTreeData);

    // Setup event listeners
    setupDragAndDrop();
    setupKeyboardNavigation();

    // Setup view switcher
    setupViewSwitcher();

    // Setup input switch
    setupInputSwitch();

    // Setup file sort controls
    setupSortControls();
}

function createFileEntry(name, data, type) {
    return {
        id: ++fileIdCounter,
        name,
        data,
        type,
        addedAt: Date.now() + fileIdCounter
    };
}

function getCurrentFileId() {
    if (currentFileIndex < 0 || currentFileIndex >= fileList.length) return null;
    return fileList[currentFileIndex].id;
}

function getFileIndexById(fileId) {
    return fileList.findIndex(file => file.id === fileId);
}

function applySort(mode, keepCurrent = true) {
    const activeFileId = keepCurrent ? getCurrentFileId() : null;
    currentSortMode = mode;

    if (mode === 'name') {
        fileList.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }));
    } else if (mode === 'time') {
        fileList.sort((a, b) => a.addedAt - b.addedAt);
    }

    if (keepCurrent && activeFileId !== null) {
        const newIndex = getFileIndexById(activeFileId);
        if (newIndex >= 0) {
            currentFileIndex = newIndex;
        }
    }
}

function setupSortControls() {
    const sortMode = document.getElementById('sortMode');
    const sortHint = document.getElementById('sortHint');
    if (!sortMode || !sortHint) return;

    sortMode.value = currentSortMode;
    sortHint.textContent = '手动模式：可拖动条目调整顺序';

    sortMode.addEventListener('change', function() {
        applySort(this.value, true);
        sortHint.textContent = this.value === 'manual'
            ? '手动模式：可拖动条目调整顺序'
            : this.value === 'name'
                ? '当前按文件名自动排序'
                : '当前按上传时间自动排序';
        updateFileListUI();
        updateNavButtons();
    });
}

// Setup view switcher
function setupViewSwitcher() {
    const jsonEditor = document.getElementById('json-editor');
    const updateTreeBtn = document.getElementById('updateTreeBtn');
    const visualBtn = document.getElementById('visualBtn');
    const jsonBtn = document.getElementById('jsonBtn');

    // Initialize JSON editor with current tree data
    jsonEditor.value = currentTreeData ? JSON.stringify(currentTreeData, null, 2) : '';

    // Button click events
    visualBtn.addEventListener('click', function() {
        switchView('visual');
    });

    jsonBtn.addEventListener('click', function() {
        switchView('json');
    });

    // Initialize button states
    visualBtn.classList.add('active');

    // Update tree from JSON editor
    updateTreeBtn.addEventListener('click', function() {
        try {
            const jsonData = JSON.parse(jsonEditor.value);
            currentTreeData = jsonData;
            loadNewTree(currentTreeData);
            showSuccess('树结构已更新');
        } catch (error) {
            showError('JSON解析错误: ' + error.message);
        }
    });

    // Auto-update JSON editor when tree changes
    const originalLoadNewTree = loadNewTree;
    loadNewTree = function(data) {
        originalLoadNewTree(data);
        jsonEditor.value = data ? JSON.stringify(data, null, 2) : '';
    };
}

// Switch view function (called from sidebar buttons)
function switchView(viewType) {
    const isJsonView = viewType === 'json';
    const treeContainer = document.getElementById('tree-container');
    const jsonContainer = document.getElementById('json-container');
    const visualBtn = document.getElementById('visualBtn');
    const jsonBtn = document.getElementById('jsonBtn');

    // Toggle views
    treeContainer.classList.toggle('hidden', isJsonView);
    jsonContainer.classList.toggle('hidden', !isJsonView);

    // Update button states
    visualBtn.classList.toggle('active', !isJsonView);
    jsonBtn.classList.toggle('active', isJsonView);
}

// Setup input switch
function setupInputSwitch() {
    const inputToggle = document.getElementById('inputToggle');
    const inputLabel = document.getElementById('inputLabel');
    const fileUploadSection = document.getElementById('file-upload-section');
    const textInputSection = document.getElementById('text-input-section');

    inputToggle.addEventListener('change', function() {
        const isTextInput = this.checked;
        fileUploadSection.classList.toggle('hidden', isTextInput);
        textInputSection.classList.toggle('hidden', !isTextInput);
        inputLabel.textContent = isTextInput ? '粘贴JSON' : '上传文件';
    });
}


// Drag and Drop handlers
function setupDragAndDrop() {
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

        const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.json'));
        if (files.length === 0) {
            showError('请拖拽 JSON 文件');
            return;
        }

        processFiles(files);
    }

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
}

// Keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            switchToPrev();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            switchToNext();
        }
    });
}

// File upload handler
function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    processFiles(files);
    event.target.value = '';
}

// Process multiple files
function processFiles(files) {
    let successCount = 0, failCount = 0, processedCount = 0;
    const newFileIds = [];

    files.forEach(file => {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                const entry = createFileEntry(file.name, jsonData, "file");
                fileList.push(entry);
                newFileIds.push(entry.id);
                successCount++;
            } catch (err) {
                failCount++;
            }
            processedCount++;
            checkComplete();
        };

        reader.onerror = function() {
            failCount++;
            processedCount++;
            checkComplete();
        };

        reader.readAsText(file);
    });

    function checkComplete() {
        if (processedCount === files.length) {
            applySort(currentSortMode, true);
            updateFileListUI();

            if (successCount > 0) {
                const firstNewIndex = getFileIndexById(newFileIds[0]);
                if (firstNewIndex >= 0) {
                    switchToFile(firstNewIndex);
                }
                showSuccess('成功加载 ' + successCount + ' 个文件');
            }

            if (failCount > 0) {
                showError(failCount + ' 个文件加载失败');
            }
        }
    }
}

// Text input handler
function handleTextInput() {
    const text = document.getElementById('json-text').value.trim();
    if (!text) {
        showError('请输入 JSON 数据');
        return;
    }

    try {
        const jsonData = JSON.parse(text);
        const timestamp = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const entry = createFileEntry('粘贴的数据 ' + timestamp, jsonData, "pasted");
        fileList.push(entry);

        const newFileId = entry.id;
        applySort(currentSortMode, true);
        const newIndex = getFileIndexById(newFileId);
        updateFileListUI();
        if (newIndex >= 0) {
            switchToFile(newIndex);
        }
        document.getElementById('json-text').value = '';
        showSuccess('已添加到列表');
    } catch (err) {
        showError('JSON 解析错误: ' + err.message);
    }
}

// File navigation
function switchToFile(index) {
    if (index < 0 || index >= fileList.length) return;

    currentFileIndex = index;
    currentTreeData = fileList[index].data;

    loadNewTree(currentTreeData);
    updateFileListUI();
    updateNavButtons();
}

function switchToPrev() {
    if (currentFileIndex > 0) {
        switchToFile(currentFileIndex - 1);
    }
}

function switchToNext() {
    if (currentFileIndex < fileList.length - 1) {
        switchToFile(currentFileIndex + 1);
    }
}

// UI Updates
function updateNavButtons() {
    document.getElementById('prevBtn').disabled = currentFileIndex <= 0;
    document.getElementById('nextBtn').disabled = currentFileIndex >= fileList.length - 1;
    document.getElementById('currentIndex').textContent = fileList.length > 0 ? currentFileIndex + 1 : 0;
    document.getElementById('totalFiles').textContent = fileList.length;
}

function updateFileListUI() {
    const listContainer = document.getElementById('file-list');
    listContainer.innerHTML = '';

    if (fileList.length === 0) {
        const emptyTip = document.createElement('div');
        emptyTip.className = 'file-list-empty';
        emptyTip.innerHTML = '暂无树数据<br>请上传或粘贴 JSON';
        listContainer.appendChild(emptyTip);
        return;
    }

    fileList.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item' + (index === currentFileIndex ? ' active' : '');
        item.dataset.fileId = String(file.id);
        item.onclick = (e) => {
            if (!e.target.closest('.remove-btn')) {
                switchToFile(index);
            }
        };

        const icon = file.type === 'file' ? '📄' : file.type === 'pasted' ? '📋' : '🌲';
        const dragHandle = currentSortMode === 'manual' ? '<span class="drag-handle" title="拖动排序">⋮⋮</span>' : '';

        item.innerHTML = dragHandle +
            '<span class="file-icon">' + icon + '</span>' +
            '<span class="file-name">' + file.name + '</span>' +
            '<button class="remove-btn" title="移除">×</button>';

        if (currentSortMode === 'manual') {
            item.draggable = true;
            item.addEventListener('dragstart', handleFileDragStart);
            item.addEventListener('dragover', handleFileDragOver);
            item.addEventListener('dragleave', handleFileDragLeave);
            item.addEventListener('drop', handleFileDrop);
            item.addEventListener('dragend', handleFileDragEnd);
        }

        const removeBtn = item.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeFile(index);
            };
        }

        listContainer.appendChild(item);
    });
}

function handleFileDragStart(e) {
    draggedFileId = Number(this.dataset.fileId);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleFileDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
}

function handleFileDragLeave() {
    this.classList.remove('drag-over');
}

function handleFileDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const targetFileId = Number(this.dataset.fileId);
    if (!draggedFileId || draggedFileId === targetFileId) return;

    const fromIndex = getFileIndexById(draggedFileId);
    const toIndex = getFileIndexById(targetFileId);
    if (fromIndex < 0 || toIndex < 0) return;

    const activeFileId = getCurrentFileId();
    const [moved] = fileList.splice(fromIndex, 1);
    fileList.splice(toIndex, 0, moved);

    if (activeFileId !== null) {
        currentFileIndex = getFileIndexById(activeFileId);
    }

    updateFileListUI();
    updateNavButtons();
}

function handleFileDragEnd() {
    draggedFileId = null;
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('dragging');
        item.classList.remove('drag-over');
    });
}

function removeFile(index) {
    if (index < 0 || index >= fileList.length) {
        return;
    }

    const removedCurrent = currentFileIndex === index;
    fileList.splice(index, 1);

    if (fileList.length === 0) {
        currentFileIndex = -1;
        currentTreeData = null;
        renderEmptyState();
        updateFileListUI();
        updateNavButtons();
        showSuccess('列表已清空，请上传或粘贴 JSON');
        return;
    }

    if (currentFileIndex > index) {
        currentFileIndex--;
    } else if (removedCurrent) {
        currentFileIndex = Math.min(index, fileList.length - 1);
    }

    currentTreeData = fileList[currentFileIndex].data;
    loadNewTree(currentTreeData);
    updateFileListUI();
    updateNavButtons();
}

// Tree Rendering
function loadNewTree(data) {
    if (!data) {
        renderEmptyState();
        return;
    }

    currentTreeData = data;
    const jsonEditor = document.getElementById('json-editor');
    if (jsonEditor) {
        jsonEditor.placeholder = '在此编辑 JSON 数据...';
    }

    const container = document.getElementById('tree-container');
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.id = 'tree-wrapper';
    container.appendChild(wrapper);

    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.classList.add('lines-svg');
    wrapper.appendChild(svgElement);

    const treeElement = buildTree(parseTreeData(data));
    wrapper.appendChild(treeElement);

    setTimeout(drawLines, 50);
}

function renderEmptyState() {
    const container = document.getElementById('tree-container');
    container.innerHTML = '<div class="empty-tree-state">' +
        '<div class="empty-tree-title">当前没有树数据</div>' +
        '<div class="empty-tree-desc">请在右侧上传 JSON 文件，或切换到“粘贴JSON”后粘贴数据。</div>' +
        '</div>';

    const jsonEditor = document.getElementById('json-editor');
    if (jsonEditor) {
        jsonEditor.value = '';
        jsonEditor.placeholder = '当前没有树数据，请先上传或粘贴 JSON。';
    }
}

function parseTreeData(data) {
    if (typeof data === 'object' && data !== null) {
        if ('name' in data) {
            return {
                name: data.name,
                children: (data.children || []).map(c => parseTreeData(c))
            };
        }
        const keys = Object.keys(data);
        if (keys.length === 1) {
            const key = keys[0];
            const value = data[key];
            return {
                name: key,
                children: (Array.isArray(value) ? value : [value]).map(c => parseTreeData(c))
            };
        }
    }
    return { name: String(data), children: [] };
}

function buildTree(data) {
    const treeDiv = document.createElement('div');
    treeDiv.className = 'tree';
    const rootContainer = createNode(data);
    treeDiv.appendChild(rootContainer);
    return treeDiv;
}

function createNode(data) {
    const container = document.createElement('div');
    container.className = 'node-container';

    const wrapper = document.createElement('div');
    wrapper.className = 'node-wrapper';
    container.appendChild(wrapper);

    // 解析节点名称和标签
    const parts = data.name.split('|');
    const nodeLabel = parts[0];
    const tags = parts.slice(1);

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'node';
    nodeDiv.dataset.hasChildren = data.children && data.children.length > 0;

    // 创建节点内容容器
    const nodeContent = document.createElement('div');
    nodeContent.className = 'node-content';

    // 添加主标签
    const mainLabel = document.createElement('div');
    mainLabel.className = 'node-main-label';
    mainLabel.textContent = nodeLabel;
    nodeContent.appendChild(mainLabel);

    // 添加标签
    if (tags.length > 0) {
        const tagContainer = document.createElement('div');
        tagContainer.className = 'node-tags';
        tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'node-tag';
            // 处理标签格式化
            let formattedTag = tag.trim();
            // 检查是否为数字
            if (!isNaN(parseFloat(formattedTag)) && isFinite(formattedTag)) {
                const num = parseFloat(formattedTag);
                // 整数不显示小数部分，小数保留两位
                formattedTag = Number.isInteger(num) ? num.toString() : num.toFixed(2);
            }
            // 截断长文本（中文算两字符，省略阈值为10字符）
            const charCount = [...formattedTag].reduce((count, char) => {
                return count + (char.match(/[\u4e00-\u9fff]/) ? 2 : 1);
            }, 0);

            if (charCount > 10) {
                // 找到合适的截断位置
                let truncated = '';
                let currentCount = 0;
                for (let i = 0; i < formattedTag.length; i++) {
                    const char = formattedTag[i];
                    const charLength = char.match(/[\u4e00-\u9fff]/) ? 2 : 1;
                    if (currentCount + charLength > 10) {
                        break;
                    }
                    truncated += char;
                    currentCount += charLength;
                }
                tagSpan.textContent = truncated + '...';
                tagSpan.title = formattedTag;
            } else {
                tagSpan.textContent = formattedTag;
            }
            tagContainer.appendChild(tagSpan);
        });
        nodeContent.appendChild(tagContainer);
    }

    nodeDiv.appendChild(nodeContent);
    wrapper.appendChild(nodeDiv);

    if (data.children && data.children.length > 0) {
        const childrenWrapper = document.createElement('div');
        childrenWrapper.className = 'children-wrapper';

        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'children';

        data.children.forEach(child => {
            const childNode = createNode(child);
            childrenDiv.appendChild(childNode);
        });

        childrenWrapper.appendChild(childrenDiv);
        container.appendChild(childrenWrapper);

        nodeDiv.addEventListener('click', () => {
            childrenDiv.classList.toggle('hidden');
            nodeDiv.classList.toggle('collapsed');
            drawLines();
        });
    }

    return container;
}

function drawLines() {
    if (!svgElement) return;
    svgElement.innerHTML = '';

    const wrapper = document.getElementById('tree-wrapper');
    if (!wrapper) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    svgElement.style.width = wrapperRect.width + 'px';
    svgElement.style.height = wrapperRect.height + 'px';

    // ===== 精确矩形交点计算函数 =====
    function getRectIntersection(cx, cy, dx, dy, width, height, shrink = 6) {
        const halfW = width / 2;
        const halfH = height / 2;

        const absDX = Math.abs(dx);
        const absDY = Math.abs(dy);

        if (absDX === 0 && absDY === 0) {
            return { x: cx, y: cy };
        }

        const tx = absDX === 0 ? Infinity : halfW / absDX;
        const ty = absDY === 0 ? Infinity : halfH / absDY;

        const t = Math.min(tx, ty);

        // 边界交点
        let x = cx + dx * t;
        let y = cy + dy * t;

        // 向内部压一点，防止线条露出
        const length = Math.sqrt(dx * dx + dy * dy);
        x -= (dx / length) * shrink;
        y -= (dy / length) * shrink;

        return { x, y };
    }

    const nodes = document.querySelectorAll('.node[data-has-children="true"]');

    nodes.forEach(node => {
        const nodeRect = node.getBoundingClientRect();
        const parentCenterX = nodeRect.left + nodeRect.width / 2 - wrapperRect.left;
        const parentCenterY = nodeRect.top + nodeRect.height / 2 - wrapperRect.top;
        const nodeWidth = nodeRect.width;
        const nodeHeight = nodeRect.height;

        const nodeContainer = node.closest('.node-container');
        const childrenContainer = nodeContainer.querySelector('.children');

        if (childrenContainer && !childrenContainer.classList.contains('hidden')) {

            const childNodes = childrenContainer.querySelectorAll(
                ':scope > .node-container > .node-wrapper > .node'
            );

            childNodes.forEach(child => {

                const childRect = child.getBoundingClientRect();
                const childCenterX = childRect.left + childRect.width / 2 - wrapperRect.left;
                const childCenterY = childRect.top + childRect.height / 2 - wrapperRect.top;
                const childWidth = childRect.width;
                const childHeight = childRect.height;

                const dx = childCenterX - parentCenterX;
                const dy = childCenterY - parentCenterY;

                const parentPoint = getRectIntersection(
                    parentCenterX,
                    parentCenterY,
                    dx,
                    dy,
                    nodeWidth,
                    nodeHeight,
                    6
                );

                const childPoint = getRectIntersection(
                    childCenterX,
                    childCenterY,
                    -dx,
                    -dy,
                    childWidth,
                    childHeight,
                    6
                );

                const parentX = parentPoint.x;
                const parentY = parentPoint.y;
                const childX = childPoint.x;
                const childY = childPoint.y;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

                const midY = (parentY + childY) / 2;

                const d = `M ${parentX} ${parentY} 
                           C ${parentX} ${midY},
                             ${childX} ${midY},
                             ${childX} ${childY}`;

                path.setAttribute('d', d);
                path.setAttribute('class', 'link-line');

                svgElement.appendChild(path);
            });
        }
    });
}

// Message functions
function showError(msg) {
    const el = document.getElementById('error-message');
    el.textContent = msg;
    el.style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
    setTimeout(() => el.style.display = 'none', 5000);
}

function showSuccess(msg) {
    const el = document.getElementById('success-message');
    el.textContent = msg;
    el.style.display = 'block';
    document.getElementById('error-message').style.display = 'none';
    setTimeout(() => el.style.display = 'none', 3000);
}
