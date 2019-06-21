// ==UserScript==
// @name         UU Auto-login
// @namespace    https://github.com/bubblefoil/uu-autologin
// @version      0.1.1
// @description  Automatically triggers login buttons. Signs in with Google.
// @author       Ales Holy
// @match        https://uuos9.plus4u.net/*
// @match        https://oidc.plus4u.net/uu-oidcg01-main/*
// @match        https://uuidentity.plus4u.net/uu-identitymanagement-main*
// @grant        GM_addStyle
// ==/UserScript==

// language=CSS
GM_addStyle(`
    circle.auto-login-clock {
        fill: transparent;
        stroke: limegreen;
        stroke-width: 2;
        stroke-dasharray: 250;
        stroke-dashoffset: 0;
        animation: rotate 1.5s linear;
    }

    @keyframes rotate {
        to {
            stroke-dashoffset: 250;
        }
    }
`);

class CancellableTimeout {

    constructor(callback, delay = 1500) {
        this._cancelled = false;
        setTimeout(() => {
            if (!this._cancelled && callback && typeof callback == "function") {
                // debugger;
                console.debug('Timeout action...');
                callback();
            }
        }, delay);
    }

    cancel() {
        console.debug('Timeout canceled');
        this._cancelled = true;
    }
}

class DelayedClick {
    constructor(delay = 1500) {
        this._delay = delay;
    }

    clickLater(node) {
        if (this._node === node) {
            return;
        } else if (this._cancellableTimeout) {
            this._cancellableTimeout.cancel();
            document.querySelectorAll('auto-login-progress').forEach(n => n.remove());
        }
        this._node = node;
        this._cancellableTimeout = new CancellableTimeout(() => node.click(), this._delay);
        let circle = document.createElement('span');
        circle.classList.add('auto-login-progress');
        circle.innerHTML = `
  <svg height="24" width="24">
    <circle class="auto-login-clock" style="animation: rotate ${this._delay * 0.001}s linear" cx="12" cy="12" r="10" />
  </svg>`;
        node.appendChild(circle);
        document.onclick = (ev) => {
            this._cancellableTimeout.cancel();
            console.debug('Document click event, cancelling auto-login', ev);
            document.querySelectorAll('auto-login-progress').forEach(n => n.remove());
        };
    }
}

class WtmDomObserver {

    constructor() {
        this.observeOptions = {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true,
            attributeOldValue: false,
            characterDataOldValue: false,
        };
        this.mutationObserver = null;
        this.clicker = new DelayedClick()
    }

    static googleButton(){
        let buttons = document.querySelectorAll('#gate-inner > button');
        if (buttons.length !== 3) {
            buttons = document.querySelectorAll('button.uu-identitymanagement-bricks-third-party-button-group-button-service');
        }
        if (buttons.length === 3) {
            return buttons[0];
        }
    }

    observe() {
        const delayedClick = (node) => {
            this.clicker.clickLater(node);
        };

        this.mutationObserver = new MutationObserver(function (mutations) {
            let loginButton = document.querySelector('button.plus4u5-app-login-button');
            if (loginButton) {
                console.debug('UU autologin: Will click this button in a moment: ', loginButton);
                delayedClick(loginButton);
                return;
            }

            const btns = Array.from(document.querySelectorAll('#gate-inner > button'));
            const gBtn = WtmDomObserver.googleButton();
            if (gBtn) {
                console.log('UU autologin: Will click a "Log in with Google" button in a moment:', gBtn);
                delayedClick(gBtn);
                disconnectObserver();
            }
        });

        let disconnectObserver = () => {
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
            }
        };
        this.mutationObserver.observe(document.body, this.observeOptions);
    }

}

(function () {
    'use strict';
    const brickObserver = new WtmDomObserver();
    brickObserver.observe();
})();
