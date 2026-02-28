/* Tree Visualization State & Shared Utilities */

window.TreeVis = window.TreeVis || {};

(function initState(TV) {
    TV.config = {
        MIN_TREE_ZOOM: 0.4,
        MAX_TREE_ZOOM: 2.2,
        TREE_ZOOM_STEP: 0.1
    };

    TV.state = {
        svgElement: null,
        currentTreeData: null,
        fileList: [],
        currentFileIndex: -1,
        fileIdCounter: 0,
        currentSortMode: 'manual',
        draggedFileId: null,
        treeZoom: 1,
        isSpacePressed: false,
        isPanning: false,
        panStartX: 0,
        panStartY: 0,
        panStartScrollLeft: 0,
        panStartScrollTop: 0,
        panStartWindowScrollY: 0,
        panHasMoved: false,
        suppressClickAfterPan: false
    };

    TV.utils = {
        clampZoom(zoom) {
            return Math.min(TV.config.MAX_TREE_ZOOM, Math.max(TV.config.MIN_TREE_ZOOM, zoom));
        },

        formatZoomPercent(zoom) {
            return Math.round(zoom * 100) + '%';
        },

        isEditableElement(el) {
            if (!el) return false;
            const tag = el.tagName;
            return el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
        }
    };

    TV.showError = function showError(msg) {
        const el = document.getElementById('error-message');
        if (!el) return;

        el.textContent = msg;
        el.style.display = 'block';

        const successEl = document.getElementById('success-message');
        if (successEl) {
            successEl.style.display = 'none';
        }

        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    };

    TV.showSuccess = function showSuccess(msg) {
        const el = document.getElementById('success-message');
        if (!el) return;

        el.textContent = msg;
        el.style.display = 'block';

        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.style.display = 'none';
        }

        setTimeout(() => {
            el.style.display = 'none';
        }, 3000);
    };
})(window.TreeVis);
