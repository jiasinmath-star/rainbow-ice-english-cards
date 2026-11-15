(() => {
  const cards = Array.isArray(window.FLASHCARD_DATA) ? window.FLASHCARD_DATA : [];
  if (!cards.length) {
    document.body.innerHTML = '<p style="padding:2rem">找不到圖卡資料。</p>';
    return;
  }

  const state = {
    index: 0,
    flipped: false,
    unitFilter: 'grade1-unit1',
    learned: new Set(JSON.parse(localStorage.getItem('iceMagicLearned') || '[]')),
  };

  const els = {
    count: document.querySelector('#card-count'),
    scene: document.querySelector('#card-scene'),
    flashcard: document.querySelector('#flashcard'),
    front: document.querySelector('#main-front'),
    back: document.querySelector('#main-back'),
    flip: document.querySelector('#flip-card'),
    previous: document.querySelector('#previous-card'),
    next: document.querySelector('#next-card'),
    dots: document.querySelector('#progress-dots'),
    timePill: document.querySelector('#time-pill'),
    phrase: document.querySelector('#current-phrase'),
    translation: document.querySelector('#current-translation'),
    usage: document.querySelector('#current-usage'),
    speak: document.querySelector('#speak-card'),
    learned: document.querySelector('#learned-card'),
    note: document.querySelector('#learning-note'),
    random: document.querySelector('#random-card'),
    grid: document.querySelector('#card-grid'),
    unitFilter: document.querySelector('#unit-filter'),
  };

  const visibleCards = () => cards.filter((card) => state.unitFilter === 'all' || card.unit === state.unitFilter);

  function currentCard() {
    return cards[state.index];
  }

  function cardIndex(id) {
    return cards.findIndex((card) => card.id === id);
  }

  function saveLearned() {
    localStorage.setItem('iceMagicLearned', JSON.stringify([...state.learned]));
  }

  function setFlipped(value) {
    state.flipped = value;
    els.flashcard.classList.toggle('flipped', value);
    els.flip.innerHTML = value
      ? '<span aria-hidden="true">↻</span> 翻回圖片'
      : '<span aria-hidden="true">↻</span> 翻到背面';
    els.scene.setAttribute('aria-label', value ? '翻回圖卡正面' : '翻開圖卡背面');
  }

  function renderDots() {
    els.dots.innerHTML = '';
    visibleCards().forEach((card) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `progress-dot${card.id === currentCard().id ? ' active' : ''}`;
      button.style.setProperty('--active-accent', card.accent);
      button.setAttribute('aria-label', `前往 ${card.phrase}`);
      button.addEventListener('click', () => selectCard(cardIndex(card.id)));
      els.dots.append(button);
    });
  }

  function renderLibrary() {
    els.grid.innerHTML = '';
    cards.forEach((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'library-card';
      button.dataset.id = card.id;
      button.style.setProperty('--card-accent', card.accent);
      button.innerHTML = `
        <img class="library-thumb" src="${card.front}" alt="${card.phrase} 圖卡圖片" loading="lazy" />
        <span class="library-copy">
          <small>${card.icon} ${card.categoryLabel || card.unitLabel}</small>
          <strong>${card.phrase}</strong>
          <span>${card.translation}</span>
        </span>
        <span class="learned-star" aria-label="已學會">★</span>
      `;
      button.addEventListener('click', () => {
        selectCard(index);
        document.querySelector('#learn').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      els.grid.append(button);
    });
    updateLibraryState();
  }

  function updateLibraryState() {
    const visibleIds = new Set(visibleCards().map((card) => card.id));
    document.querySelectorAll('.library-card').forEach((element) => {
      const id = element.dataset.id;
      element.classList.toggle('active', id === currentCard().id);
      element.classList.toggle('learned', state.learned.has(id));
      element.classList.toggle('hidden', !visibleIds.has(id));
    });
  }

  function updateLearnedButton() {
    const learned = state.learned.has(currentCard().id);
    els.learned.setAttribute('aria-pressed', learned ? 'true' : 'false');
    els.learned.innerHTML = learned
      ? '<span aria-hidden="true">★</span> 已經會了'
      : '<span aria-hidden="true">☆</span> 我會了';
  }

  function selectCard(index) {
    state.index = (index + cards.length) % cards.length;
    const card = currentCard();
    setFlipped(false);
    els.front.src = card.front;
    els.front.alt = `${card.phrase} 正面情境圖片`;
    els.back.src = card.back;
    els.back.alt = `${card.phrase} 背面音節與造句`;
    els.timePill.textContent = `${card.icon} ${card.unitLabel}`;
    els.timePill.style.borderColor = `${card.accent}55`;
    els.phrase.textContent = card.phrase;
    els.phrase.style.color = card.accent;
    els.translation.textContent = card.translation;
    els.usage.textContent = card.usage;
    els.note.textContent = card.id === 'good-evening' || card.id === 'good-night'
      ? 'Good evening 是晚上見面時說；Good night 是睡前或道別時說。'
      : '先看圖片猜意思，再翻到背面，把音節一個一個念出來。';
    renderDots();
    updateLearnedButton();
    updateLibraryState();
  }

  function step(direction) {
    const available = visibleCards();
    const currentVisibleIndex = available.findIndex((card) => card.id === currentCard().id);
    const base = currentVisibleIndex >= 0 ? currentVisibleIndex : 0;
    const next = available[(base + direction + available.length) % available.length];
    selectCard(cardIndex(next.id));
  }

  function speakCurrent() {
    if (!('speechSynthesis' in window)) {
      els.speak.querySelector('small').textContent = '此瀏覽器不支援語音';
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentCard().phrase);
    utterance.lang = 'en-US';
    utterance.rate = 0.72;
    utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
    els.speak.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }],
      { duration: 480, easing: 'ease-out' },
    );
  }

  els.scene.addEventListener('click', () => setFlipped(!state.flipped));
  els.scene.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setFlipped(!state.flipped);
    }
  });
  els.flip.addEventListener('click', () => setFlipped(!state.flipped));
  els.previous.addEventListener('click', () => step(-1));
  els.next.addEventListener('click', () => step(1));
  els.speak.addEventListener('click', speakCurrent);
  els.learned.addEventListener('click', () => {
    const id = currentCard().id;
    state.learned.has(id) ? state.learned.delete(id) : state.learned.add(id);
    saveLearned();
    updateLearnedButton();
    updateLibraryState();
  });
  els.random.addEventListener('click', () => {
    const available = visibleCards();
    const options = available.filter((card) => card.id !== currentCard().id);
    const pool = options.length ? options : available;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    selectCard(cardIndex(chosen.id));
    document.querySelector('#learn').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  els.unitFilter.addEventListener('change', () => {
    state.unitFilter = els.unitFilter.value;
    const available = visibleCards();
    if (!available.some((card) => card.id === currentCard().id)) {
      selectCard(cardIndex(available[0].id));
    } else {
      renderDots();
      updateLibraryState();
    }
    els.count.textContent = state.unitFilter === 'all'
      ? `${cards.length} 張圖卡`
      : `${available.length} 張圖卡`;
  });
  document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName)) return;
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
    if (event.key === ' ') {
      event.preventDefault();
      setFlipped(!state.flipped);
    }
  });

  const units = [...new Map(cards.map((card) => [card.unit, card.unitLabel])).entries()];
  units.forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    els.unitFilter.append(option);
  });
  els.unitFilter.value = state.unitFilter;
  els.count.textContent = `${visibleCards().length} 張圖卡`;
  renderLibrary();
  selectCard(cardIndex(visibleCards()[0].id));
})();
