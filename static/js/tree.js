/* Tree Rendering, Lines and Zoom */

(function initTreeModule(TV) {
    TV.updateZoomUI = function updateZoomUI() {
        const state = TV.state;
        const zoomValue = document.getElementById('zoomValue');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');

        if (zoomValue) {
            zoomValue.textContent = TV.utils.formatZoomPercent(state.treeZoom);
        }
        if (zoomInBtn) {
            zoomInBtn.disabled = state.treeZoom >= TV.config.MAX_TREE_ZOOM;
        }
        if (zoomOutBtn) {
            zoomOutBtn.disabled = state.treeZoom <= TV.config.MIN_TREE_ZOOM;
        }
    };

    TV.applyTreeZoom = function applyTreeZoom() {
        const treeScale = document.getElementById('tree-scale');
        if (treeScale) {
            treeScale.style.zoom = String(TV.state.treeZoom);
        }

        TV.updateZoomUI();
        setTimeout(TV.drawLines, 0);
    };

    TV.setTreeZoom = function setTreeZoom(nextZoom) {
        TV.state.treeZoom = TV.utils.clampZoom(nextZoom);
        TV.applyTreeZoom();
    };

    TV.setupZoomControls = function setupZoomControls() {
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const zoomResetBtn = document.getElementById('zoomResetBtn');

        if (!zoomInBtn || !zoomOutBtn || !zoomResetBtn) return;

        zoomInBtn.addEventListener('click', () => {
            TV.setTreeZoom(TV.state.treeZoom + TV.config.TREE_ZOOM_STEP);
        });

        zoomOutBtn.addEventListener('click', () => {
            TV.setTreeZoom(TV.state.treeZoom - TV.config.TREE_ZOOM_STEP);
        });

        zoomResetBtn.addEventListener('click', () => {
            TV.setTreeZoom(1);
        });

        TV.updateZoomUI();
    };

    TV.loadNewTree = function loadNewTree(data) {
        if (!data) {
            TV.renderEmptyState();
            return;
        }

        const state = TV.state;
        state.currentTreeData = data;

        const jsonEditor = document.getElementById('json-editor');
        if (jsonEditor) {
            jsonEditor.placeholder = '在此编辑 JSON 数据...';
            jsonEditor.value = JSON.stringify(data, null, 2);
        }

        const container = document.getElementById('tree-container');
        if (!container) return;
        container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.id = 'tree-wrapper';
        container.appendChild(wrapper);

        const treeScale = document.createElement('div');
        treeScale.id = 'tree-scale';
        wrapper.appendChild(treeScale);

        state.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        state.svgElement.classList.add('lines-svg');
        treeScale.appendChild(state.svgElement);

        const treeElement = TV.buildTree(TV.parseTreeData(data));
        treeScale.appendChild(treeElement);

        TV.applyTreeZoom();
        setTimeout(TV.drawLines, 50);
    };

    TV.renderEmptyState = function renderEmptyState() {
        const container = document.getElementById('tree-container');
        if (!container) return;

        container.innerHTML = '<div class="empty-tree-state">' +
            '<div class="empty-tree-title">当前没有树数据</div>' +
            '<div class="empty-tree-desc">请在右侧上传 JSON 文件，或切换到“粘贴JSON”后粘贴数据。</div>' +
            '</div>';

        const jsonEditor = document.getElementById('json-editor');
        if (jsonEditor) {
            jsonEditor.value = '';
            jsonEditor.placeholder = '当前没有树数据，请先上传或粘贴 JSON。';
        }
    };

    TV.parseTreeData = function parseTreeData(data) {
        if (typeof data === 'object' && data !== null) {
            if ('name' in data) {
                return {
                    name: data.name,
                    children: (data.children || []).map((c) => TV.parseTreeData(c))
                };
            }

            const keys = Object.keys(data);
            if (keys.length === 1) {
                const key = keys[0];
                const value = data[key];
                return {
                    name: key,
                    children: (Array.isArray(value) ? value : [value]).map((c) => TV.parseTreeData(c))
                };
            }
        }

        return { name: String(data), children: [] };
    };

    TV.buildTree = function buildTree(data) {
        const treeDiv = document.createElement('div');
        treeDiv.className = 'tree';
        treeDiv.appendChild(TV.createNode(data));
        return treeDiv;
    };

    TV.createNode = function createNode(data) {
        const container = document.createElement('div');
        container.className = 'node-container';

        const wrapper = document.createElement('div');
        wrapper.className = 'node-wrapper';
        container.appendChild(wrapper);

        const parts = data.name.split('|');
        const nodeLabel = parts[0];
        const tags = parts.slice(1);

        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'node';
        nodeDiv.dataset.hasChildren = data.children && data.children.length > 0;

        const nodeContent = document.createElement('div');
        nodeContent.className = 'node-content';

        const mainLabel = document.createElement('div');
        mainLabel.className = 'node-main-label';
        mainLabel.textContent = nodeLabel;
        nodeContent.appendChild(mainLabel);

        if (tags.length > 0) {
            const tagContainer = document.createElement('div');
            tagContainer.className = 'node-tags';

            tags.forEach((tag) => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'node-tag';

                let formattedTag = tag.trim();
                if (!isNaN(parseFloat(formattedTag)) && isFinite(formattedTag)) {
                    const num = parseFloat(formattedTag);
                    formattedTag = Number.isInteger(num) ? num.toString() : num.toFixed(2);
                }

                const charCount = [...formattedTag].reduce((count, char) => {
                    return count + (char.match(/[\u4e00-\u9fff]/) ? 2 : 1);
                }, 0);

                if (charCount > 10) {
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

            data.children.forEach((child) => {
                childrenDiv.appendChild(TV.createNode(child));
            });

            childrenWrapper.appendChild(childrenDiv);
            container.appendChild(childrenWrapper);

            nodeDiv.addEventListener('click', () => {
                childrenDiv.classList.toggle('hidden');
                nodeDiv.classList.toggle('collapsed');
                TV.drawLines();
            });
        }

        return container;
    };

    TV.drawLines = function drawLines() {
        const state = TV.state;
        if (!state.svgElement) return;

        state.svgElement.innerHTML = '';

        const treeScale = document.getElementById('tree-scale');
        if (!treeScale) return;

        const wrapperRect = treeScale.getBoundingClientRect();
        const zoomFactor = state.treeZoom || 1;
        const unscaledWidth = wrapperRect.width / zoomFactor;
        const unscaledHeight = wrapperRect.height / zoomFactor;
        state.svgElement.style.width = unscaledWidth + 'px';
        state.svgElement.style.height = unscaledHeight + 'px';

        function getRectIntersection(cx, cy, dx, dy, width, height, shrink) {
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

            let x = cx + dx * t;
            let y = cy + dy * t;

            const length = Math.sqrt(dx * dx + dy * dy);
            x -= (dx / length) * shrink;
            y -= (dy / length) * shrink;

            return { x, y };
        }

        const nodes = document.querySelectorAll('.node[data-has-children="true"]');

        nodes.forEach((node) => {
            const nodeRect = node.getBoundingClientRect();
            const parentCenterX = (nodeRect.left + nodeRect.width / 2 - wrapperRect.left) / zoomFactor;
            const parentCenterY = (nodeRect.top + nodeRect.height / 2 - wrapperRect.top) / zoomFactor;
            const nodeWidth = nodeRect.width / zoomFactor;
            const nodeHeight = nodeRect.height / zoomFactor;

            const nodeContainer = node.closest('.node-container');
            if (!nodeContainer) return;

            const childrenContainer = nodeContainer.querySelector('.children');
            if (!childrenContainer || childrenContainer.classList.contains('hidden')) return;

            const childNodes = childrenContainer.querySelectorAll(':scope > .node-container > .node-wrapper > .node');

            childNodes.forEach((child) => {
                const childRect = child.getBoundingClientRect();
                const childCenterX = (childRect.left + childRect.width / 2 - wrapperRect.left) / zoomFactor;
                const childCenterY = (childRect.top + childRect.height / 2 - wrapperRect.top) / zoomFactor;
                const childWidth = childRect.width / zoomFactor;
                const childHeight = childRect.height / zoomFactor;

                const dx = childCenterX - parentCenterX;
                const dy = childCenterY - parentCenterY;

                const parentPoint = getRectIntersection(parentCenterX, parentCenterY, dx, dy, nodeWidth, nodeHeight, 6);
                const childPoint = getRectIntersection(childCenterX, childCenterY, -dx, -dy, childWidth, childHeight, 6);

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const midY = (parentPoint.y + childPoint.y) / 2;
                const d = `M ${parentPoint.x} ${parentPoint.y} C ${parentPoint.x} ${midY}, ${childPoint.x} ${midY}, ${childPoint.x} ${childPoint.y}`;

                path.setAttribute('d', d);
                path.setAttribute('class', 'link-line');
                state.svgElement.appendChild(path);
            });
        });
    };
})(window.TreeVis);
