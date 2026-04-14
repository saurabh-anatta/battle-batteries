import { Component } from '@theme/component';

/**
 * @typedef {Object} ProductCarouselTabsRefs
 * @property {HTMLElement[]} tabButtons - Tab button elements
 * @property {HTMLElement[]} tabPanels - Tab panel elements
 */

/** @extends {Component<ProductCarouselTabsRefs>} */
class ProductCarouselTabs extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.tabButtons = this.querySelectorAll('[role="tab"]');
    this.tabPanels = this.querySelectorAll('[role="tabpanel"]');
  }

  /**
   * Handle tab click to switch active tab and panel
   * @param {Event} event
   */
  handleTabClick(event) {
    const clickedTab = event.currentTarget;
    const tabIndex = clickedTab.getAttribute('data-tab-index');

    for (const tab of this.tabButtons) {
      const isActive = tab.getAttribute('data-tab-index') === tabIndex;
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.classList.toggle('product-carousel-tabs__tab--active', isActive);
    }

    for (const panel of this.tabPanels) {
      const isActive = panel.getAttribute('data-tab-index') === tabIndex;
      panel.hidden = !isActive;
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    }
  }

  /**
   * Handle keyboard navigation within tab list
   * @param {KeyboardEvent} event
   */
  handleTabKeydown(event) {
    const tabs = Array.from(this.tabButtons);
    const currentIndex = tabs.indexOf(event.currentTarget);

    let newIndex;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    tabs[newIndex].focus();
    tabs[newIndex].click();
  }
}

customElements.define('product-carousel-tabs', ProductCarouselTabs);
