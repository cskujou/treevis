/* Tree Visualization Application Entry */

(function exposeLegacyApi(TV) {
    if (!TV) {
        throw new Error('TreeVis core modules failed to load.');
    }

    window.initApp = function initApp(initialData) {
        TV.initApp(initialData);
    };

    window.switchView = function switchView(viewType) {
        TV.switchView(viewType);
    };

    window.handleFileUpload = function handleFileUpload(event) {
        TV.handleFileUpload(event);
    };

    window.handleTextInput = function handleTextInput() {
        TV.handleTextInput();
    };

    window.switchToPrev = function switchToPrev() {
        TV.switchToPrev();
    };

    window.switchToNext = function switchToNext() {
        TV.switchToNext();
    };
})(window.TreeVis);
