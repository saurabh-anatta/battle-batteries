import { Component } from '@theme/component';

/**
 * @typedef {Object} TestimonialsComponentRefs
 * @property {HTMLElement} cardsRow - Scrollable cards container
 * @property {HTMLButtonElement} arrowLeft - Left scroll arrow button
 * @property {HTMLButtonElement} arrowRight - Right scroll arrow button
 */

/** @extends {Component<TestimonialsComponentRefs>} */
class TestimonialsComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.tabButtons = this.querySelectorAll('.testimonials__tab');
    this.cards = this.querySelectorAll('.testimonials__card');
    this.cardsRow = this.querySelector('.testimonials__cards-row');

    if (this.cardsRow) {
      this.cardsRow.addEventListener('scroll', this.updateArrowStates.bind(this));
      this.updateArrowStates();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.cardsRow) {
      this.cardsRow.removeEventListener('scroll', this.updateArrowStates.bind(this));
    }
  }

  /**
   * Handle tab click to filter testimonial cards by category
   * @param {Event} event
   */
  handleTabClick(event) {
    const clickedTab = event.currentTarget;
    const category = clickedTab.getAttribute('data-label');

    for (const tab of this.tabButtons) {
      const isActive = tab === clickedTab;
      tab.classList.toggle('testimonials__tab--active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }

    for (const card of this.cards) {
      const cardCategory = card.getAttribute('data-category');

      if (!category || category === 'all') {
        card.style.display = '';
      } else {
        card.style.display = cardCategory === category ? '' : 'none';
      }
    }

    if (this.cardsRow) {
      this.cardsRow.scrollTo({ left: 0, behavior: 'smooth' });
    }

    requestAnimationFrame(() => this.updateArrowStates());
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

  /**
   * Scroll the cards row to the left
   */
  handleArrowLeft() {
    if (!this.cardsRow) return;

    const scrollAmount = this.getScrollAmount();
    this.cardsRow.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  /**
   * Scroll the cards row to the right
   */
  handleArrowRight() {
    if (!this.cardsRow) return;

    const scrollAmount = this.getScrollAmount();
    this.cardsRow.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  /**
   * Calculate scroll amount based on card width + gap
   * @returns {number}
   */
  getScrollAmount() {
    const firstVisibleCard = Array.from(this.cards).find(
      (card) => card.style.display !== 'none'
    );

    if (!firstVisibleCard) return 338;

    const cardWidth = firstVisibleCard.offsetWidth;
    const gap = parseInt(getComputedStyle(this.cardsRow).gap) || 32;
    return cardWidth + gap;
  }

  /**
   * Update disabled state on arrow buttons based on scroll position
   */
  updateArrowStates() {
    if (!this.cardsRow) return;

    const arrowLeft = this.querySelector('.testimonials__arrow--left');
    const arrowRight = this.querySelector('.testimonials__arrow--right');

    if (!arrowLeft || !arrowRight) return;

    const { scrollLeft, scrollWidth, clientWidth } = this.cardsRow;
    const atStart = scrollLeft <= 1;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 1;

    arrowLeft.disabled = atStart;
    arrowRight.disabled = atEnd;
  }
}

customElements.define('testimonials-component', TestimonialsComponent);
