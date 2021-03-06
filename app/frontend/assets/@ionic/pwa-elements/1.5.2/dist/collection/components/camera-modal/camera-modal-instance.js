import { h } from "@stencil/core";
export class PWACameraModal {
    async handlePhoto(photo) {
        this.onPhoto.emit(photo);
    }
    handleBackdropClick(e) {
        if (e.target !== this.el) {
            this.onPhoto.emit(null);
        }
    }
    handleComponentClick(e) {
        e.stopPropagation();
    }
    handleBackdropKeyUp(e) {
        if (e.key === "Escape") {
            this.onPhoto.emit(null);
        }
    }
    render() {
        return (h("div", { class: "wrapper", onClick: e => this.handleBackdropClick(e) },
            h("div", { class: "content" },
                h("pwa-camera", { onClick: e => this.handleComponentClick(e), onPhoto: (photo) => this.handlePhoto(photo) }))));
    }
    static get is() { return "pwa-camera-modal-instance"; }
    static get encapsulation() { return "shadow"; }
    static get originalStyleUrls() { return {
        "$": ["camera-modal-instance.css"]
    }; }
    static get styleUrls() { return {
        "$": ["camera-modal-instance.css"]
    }; }
    static get events() { return [{
            "method": "onPhoto",
            "name": "onPhoto",
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "docs": {
                "tags": [],
                "text": ""
            },
            "complexType": {
                "original": "any",
                "resolved": "any",
                "references": {}
            }
        }]; }
    static get elementRef() { return "el"; }
    static get listeners() { return [{
            "name": "keyup",
            "method": "handleBackdropKeyUp",
            "target": "body",
            "capture": false,
            "passive": false
        }]; }
}
