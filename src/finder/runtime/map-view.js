(() => {
  const runtime = (window.SeedfinderRuntime = window.SeedfinderRuntime || {});

  function createMapView({ state, data, dom }) {
    if (!state || !data || !dom) {
      throw new Error('[finder:map-view] Missing dependencies');
    }

    const { buildingIcons, nightlordIcons, disabledSlotsByMap, config } = data;
    let handlers = {
      onSlotClick: () => {},
      getSlotOptions: () => [],
      onSelectMap: () => {},
    };

    function setHandlers(nextHandlers) {
      handlers = {
        onSlotClick: nextHandlers?.onSlotClick || handlers.onSlotClick,
        getSlotOptions: nextHandlers?.getSlotOptions || handlers.getSlotOptions,
        onSelectMap: nextHandlers?.onSelectMap || handlers.onSelectMap,
      };
    }

    function ensureSlotElements() {
      const map = state.current.slotElementById;
      if (map instanceof Map && map.size > 0) return;
      if (!dom.iconLayer) return;

      dom.iconLayer.innerHTML = '';
      const elementMap = new Map();
      for (const coord of state.current.slotCoords || []) {
        const slotId = coord.id;
        if (!slotId) continue;
        const el = document.createElement('div');
        el.classList.add('slot-icon');
        el.dataset.slotId = slotId;
        const img = document.createElement('img');
        img.src =
          slotId === 'nightlord'
            ? nightlordIcons.empty || buildingIcons.empty
            : buildingIcons.empty;
        img.alt = '';
        el.appendChild(img);
        el.addEventListener('click', evt => {
          evt.stopPropagation();
          handlers.onSlotClick(slotId);
        });
        dom.iconLayer.appendChild(el);
        elementMap.set(slotId, el);
      }
      state.setSlotElements(elementMap);
    }

    function showShiftingEarthThumbs() {
      if (!dom.thumbs) return;
      dom.thumbs.classList.add('map-thumbs');
      dom.thumbs.innerHTML = '';
      dom.thumbs.style.display = 'flex';

      const order = state.current.mapThumbOrder || [];
      if (!Array.isArray(order) || order.length === 0) return;

      const perRow = 3;
      for (let i = 0; i < order.length; i += perRow) {
        const row = document.createElement('div');
        row.classList.add('map-thumb-row');
        order.slice(i, i + perRow).forEach(type => {
          const card = document.createElement('div');
          card.classList.add('map-thumb');
          card.dataset.mapType = type;
          card.setAttribute('role', 'button');
          card.tabIndex = 0;

          const img = document.createElement('img');
          img.classList.add('map-thumb__image');
          img.src = state.current.mapBackgroundByType[type] || '';
          img.alt = type;
          img.loading = 'lazy';

          const label = document.createElement('div');
          label.classList.add('map-thumb__label');
          label.textContent = window.SeedfinderI18N?.shiftingEarthLabel?.(type) || type;

          const emitSelect = () => handlers.onSelectMap(type);
          card.addEventListener('click', emitSelect);
          card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              emitSelect();
            }
          });

          card.append(img, label);
          row.appendChild(card);
        });
        dom.thumbs.appendChild(row);
      }
    }

    function hideShiftingEarthThumbs() {
      if (!dom.thumbs) return;
      dom.thumbs.style.display = 'none';
    }

    function highlightMapButton(mapType) {
      if (!dom.mapBtns) return;
      Array.from(dom.mapBtns.children).forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mapType === mapType);
      });
    }

    function renderSlotIcons() {
      ensureSlotElements();

      const {
        slotCoords,
        slotElementById,
        selectionBySlot,
        activeMapType,
        mapBackgroundByType,
        mapPixelSize,
        slotIconSize,
      } = state.current;

      if (!activeMapType) {
        slotElementById.forEach(el => {
          el.style.display = 'none';
        });
        showShiftingEarthThumbs();
        if (dom.mapImage) dom.mapImage.src = '';
        return;
      }

      hideShiftingEarthThumbs();
      if (dom.mapImage) dom.mapImage.src = mapBackgroundByType[activeMapType] || '';
      for (const coord of slotCoords) {
        const slotId = coord.id;
        const el = slotElementById.get(slotId);
        if (!el) continue;

        const disabledSet = disabledSlotsByMap?.[activeMapType];
        if (
          slotId !== 'nightlord' &&
          disabledSet instanceof Set &&
          disabledSet.has(Number(slotId))
        ) {
          el.style.display = 'none';
          continue;
        }

        el.style.display = 'block';
        const x = (coord.x / config.MAP_ORIGINAL_SIZE) * mapPixelSize - slotIconSize / 2;
        const y = (coord.y / config.MAP_ORIGINAL_SIZE) * mapPixelSize - slotIconSize / 2;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${slotIconSize}px`;
        el.style.height = `${slotIconSize}px`;

        const currentValue = selectionBySlot[slotId] || 'empty';
        let src;
        let isGhost = false;
        if (currentValue && currentValue !== 'empty') {
          src = slotId === 'nightlord' ? nightlordIcons[currentValue] : buildingIcons[currentValue];
        } else {
          const options = handlers.getSlotOptions(slotId, false) || [];
          if (options.length === 2 && options.some(opt => opt.id !== 'empty')) {
            const ghostOption = options.find(opt => opt.id !== 'empty');
            if (ghostOption) {
              src = ghostOption.src;
              isGhost = true;
              el.dataset.ghostId = ghostOption.id;
            }
          }
        }
        if (!src) {
          src =
            slotId === 'nightlord'
              ? nightlordIcons.empty || buildingIcons.empty
              : buildingIcons.empty;
        }
        const img = el.querySelector('img');
        if (img) {
          img.src = src;
          img.alt = currentValue;
        }
        el.classList.toggle('ghost', isGhost);
      }
    }

    function recalcMapLayout() {
      const availableHeight = window.innerHeight - 64;
      const clamped = Math.min(Math.max(availableHeight, config.MAP_MIN_SIZE), config.MAP_MAX_SIZE);
      const iconSize = clamped * config.ICON_SCALE_RATIO;
      state.setSizes(clamped, iconSize);
      if (dom.mapWrapper) {
        dom.mapWrapper.style.width = `${clamped}px`;
        dom.mapWrapper.style.height = `${clamped}px`;
      }
      if (dom.iconLayer) {
        dom.iconLayer.style.width = `${clamped}px`;
        dom.iconLayer.style.height = `${clamped}px`;
      }
      renderSlotIcons();
    }

    function closeSlotPicker() {
      if (!dom.modal) return;
      dom.modal.style.display = 'none';
      dom.modal.onclick = null;
      if (dom.modalContent) {
        dom.modalContent.innerHTML = '';
      }
    }

    function openSlotPicker(slotId, options, onSelect) {
      if (!dom.modal || !dom.modalContent) return;
      dom.modalContent.innerHTML = '';
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.title = opt.id;
        const img = document.createElement('img');
        img.src = opt.src;
        img.alt = opt.id;
        btn.appendChild(img);
        btn.addEventListener('click', evt => {
          evt.stopPropagation();
          onSelect(opt);
          closeSlotPicker();
        });
        dom.modalContent.appendChild(btn);
      });
      dom.modal.style.display = 'flex';
      dom.modal.onclick = evt => {
        if (evt.target === dom.modal) {
          closeSlotPicker();
        }
      };
    }

    return {
      setHandlers,
      ensureSlotElements,
      showShiftingEarthThumbs,
      hideShiftingEarthThumbs,
      highlightMapButton,
      renderSlotIcons,
      recalcMapLayout,
      openSlotPicker,
      closeSlotPicker,
    };
  }

  runtime.createMapView = createMapView;
})();
