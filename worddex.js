// worddex.js - Handles WordDex Display, Search, and Sort

let currentSort = 'alpha';
let currentTagFilter = null;
let wordData = null;
let searchQuery = '';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sortEntries(entries, sortType) {
  switch(sortType) {
    case 'alpha':
      return entries.sort((a, b) => a[0].localeCompare(b[0]));

    case 'recent':
      return entries.sort((a, b) => {
        const timeA = a[1].timestamp || 0;
        const timeB = b[1].timestamp || 0;
        return timeB - timeA;
      });

    case 'rarity':
      return entries.sort((a, b) => {
        const rarityA = rarityOrder[a[1].rarity] ?? 3;
        const rarityB = rarityOrder[b[1].rarity] ?? 3;
        if (rarityA !== rarityB) {
          return rarityA - rarityB;
        }
        return a[0].localeCompare(b[0]);
      });

    case 'tag':
      return entries.sort((a, b) => {
        const tagsA = a[1].tags || [];
        const tagsB = b[1].tags || [];
        
        // Put tagged items first
        if (tagsA.length > 0 && tagsB.length === 0) return -1;
        if (tagsA.length === 0 && tagsB.length > 0) return 1;
        
        // Sort by first tag alpha
        if (tagsA.length > 0 && tagsB.length > 0) {
           const tagComp = tagsA[0].localeCompare(tagsB[0]);
           if (tagComp !== 0) return tagComp;
        }
        
        return a[0].localeCompare(b[0]);
      });

    default:
      return entries;
  }
}

function displayWordDex(sortType = 'alpha') {
  chrome.storage.local.get(["wordDex", "achievements", "streakData", "badges"], (data) => {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      displayError("Error loading word collection. Please try again.");
      return;
    }

    try {
      const dex = data.wordDex || {};
      const stats = data.achievements || {};
      const dexDiv = document.getElementById("dex");
      const statsDiv = document.getElementById("stats");

      if (!dexDiv || !statsDiv) {
        console.error('Required DOM elements not found');
        return;
      }

      wordData = dex;
      dexDiv.innerHTML = '';

      let entries = Object.entries(dex);

      // Filter by Search Query
      if (searchQuery) {
        entries = entries.filter(([word, info]) => {
          const searchLower = searchQuery.toLowerCase();
          return word.toLowerCase().includes(searchLower) ||
                 (info.origin && info.origin.toLowerCase().includes(searchLower));
        });
      }

      // Filter by Tag or Rarity (Unified)
      if (currentTagFilter) {
          entries = entries.filter(([word, info]) => {
              const tagMatch = info.tags && info.tags.includes(currentTagFilter);
              const rarityMatch = info.rarity && info.rarity.toLowerCase() === currentTagFilter.toLowerCase();
              return tagMatch || rarityMatch;
          });
      }
          
      // Show filter indicator if any filter is active
      if (currentTagFilter) {
          const filterMsg = document.createElement('div');
          filterMsg.className = 'filter-indicator';
          
          let msgText = `${t('filterByTag')}: `; // "Filtering:" or "Filter by Tag:"
          // Wait, t('filterByTag') is "Filter by Tag" in menu. Maybe simpler "Filtering: " is better?
          // Let's use a generic "Filtering" key or just hardcode if not strict. 
          // Actually i18n doesn't have "Filtering". Let's add it or use "Filter by Tag"
          
          filterMsg.innerHTML = `<span>Filtering: <strong>${currentTagFilter}</strong></span> <button id="clearFilters">${t('clearFilter')}</button>`;
          dexDiv.appendChild(filterMsg);
          
          // We need to attach event after appending
          setTimeout(() => {
              const clearBtn = document.getElementById('clearFilters');
              if(clearBtn) clearBtn.onclick = () => {
                  currentTagFilter = null;
                  displayWordDex(currentSort);
              };
          }, 0);
      }

      entries = sortEntries(entries, sortType);

      if (entries.length === 0 && searchQuery) {
        dexDiv.innerHTML = `<p style="color: gray; text-align: center; padding: 20px;">${t('noSearchResults')}</p>`;
      } else if (entries.length === 0) {
        dexDiv.innerHTML = `<p style="color: gray; text-align: center; padding: 20px;">${t('noWordsMessage')}</p>`;
      } else {
        entries.forEach(([word, info]) => {
          if (!info || typeof info !== 'object') {
            console.warn(`Invalid data for word: ${word}`);
            return;
          }

          const div = document.createElement("div");
          div.className = "word-entry";
          div.style.position = 'relative';

          const rarity = info.rarity || 'common';
          const origin = info.origin || info.definition || 'No information available';

          const wordStrong = document.createElement('strong');
          wordStrong.textContent = word;
          wordStrong.style.color = rarityScale[rarity] || '#6b5b95';
          if (rarity === 'common') {
            wordStrong.style.color = '#9b9b9b';
          }
          
          // Rainbow effect for 'lingomon'
          if (word.toLowerCase() === 'lingomon') {
            wordStrong.style.backgroundImage = 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)';
            wordStrong.style.backgroundSize = '200% auto';
            wordStrong.style.webkitBackgroundClip = 'text';
            wordStrong.style.webkitTextFillColor = 'transparent';
            wordStrong.style.animation = 'rainbow 2s linear infinite';
            
            // Add style for keyframes if not present
            if (!document.getElementById('rainbow-style')) {
              const style = document.createElement('style');
              style.id = 'rainbow-style';
              style.innerHTML = `
                @keyframes rainbow {
                  to { background-position: 200% center; }
                }
              `;
              document.head.appendChild(style);
            }
          }

          // Inline Tag Container
          const metaRow = document.createElement('div');
          metaRow.style.display = 'flex';
          metaRow.style.alignItems = 'center';
          metaRow.style.gap = '8px';
          metaRow.style.marginTop = '2px';
          
          // Rarity Badge (Styled like a tag)
          const rarityBadge = document.createElement('span');
          rarityBadge.className = 'tag-badge rarity-badge';
          rarityBadge.textContent = t(rarity.toUpperCase());
          rarityBadge.style.fontWeight = 'bold';
          
          if (rarity === 'god') {
             rarityBadge.classList.add('rainbow-text');
             // Border handled by CSS class now
          } else {
             const rColor = rarityScale[rarity] || '#9b8bb5';
             rarityBadge.style.color = rColor;
             rarityBadge.style.borderColor = rColor;
             // Light background tint based on rarity color?
             // For now just white/dark background with colored text/border
             rarityBadge.style.background = 'transparent';
          }
          
          metaRow.appendChild(rarityBadge);

          const tagContainer = document.createElement('div');
          tagContainer.className = 'inline-tag-container';
          
          const refreshInlineTags = () => {
              tagContainer.innerHTML = '';
              if (info.tags) {
                  info.tags.forEach(tag => {
                      const badge = document.createElement('span');
                      badge.className = 'tag-badge';
                      badge.textContent = tag;
                      badge.title = 'Click to remove';
                      badge.style.cursor = 'pointer';
                      badge.onclick = (e) => {
                          e.stopPropagation();
                          if(confirm(`Remove tag "${tag}"?`)) {
                              removeTagGlobal(word, tag);
                          }
                      };
                      tagContainer.appendChild(badge);
                  });
              }
              
              const addBtn = document.createElement('button');
              addBtn.className = 'tag-plus-btn';
              addBtn.textContent = '+';
              addBtn.onclick = (e) => {
                  e.stopPropagation();
                  // Switch to input
                  const input = document.createElement('input');
                  input.className = 'inline-tag-input';
                  input.placeholder = 'Tag...';
                  input.setAttribute('list', 'existingTags');
                  
                  // Auto-focus and handle save
                  input.onblur = () => {
                      const val = input.value.trim();
                      if (val) addTagGlobal(word, val);
                      else refreshInlineTags(); // Revert
                  };
                  input.onkeydown = (ev) => {
                      if (ev.key === 'Enter') {
                          const val = input.value.trim();
                          if (val) addTagGlobal(word, val);
                          else refreshInlineTags();
                      }
                      if (ev.key === 'Escape') refreshInlineTags();
                  };
                  
                  tagContainer.innerHTML = ''; // Clear badges momentarily
                  tagContainer.appendChild(input);
                  input.focus();
              };
              tagContainer.appendChild(addBtn);
          };
          refreshInlineTags();
          
          metaRow.appendChild(tagContainer);

          const originDiv = document.createElement('div');
          originDiv.className = 'word-info';
          originDiv.textContent = origin.length > 150 ? origin.substring(0, 150) + '...' : origin;

          const frequencyDiv = document.createElement('div');
          frequencyDiv.className = 'frequency-info';
          frequencyDiv.style.fontSize = '11px';
          frequencyDiv.style.marginTop = '4px';

          // Tags Display (Removed - now inline)
          /*
          if (info.tags && info.tags.length > 0) {
             const tagsDiv = document.createElement('div');
             tagsDiv.className = 'word-tags';
             info.tags.forEach(tag => {
                 const badge = document.createElement('span');
                 badge.className = 'tag-badge';
                 badge.textContent = tag;
                 tagsDiv.appendChild(badge);
             });
             div.appendChild(tagsDiv);
          }
          */

          if (info.frequency !== undefined && info.frequency !== null) {
            const freqDisplay = info.frequency >= 1
              ? info.frequency.toFixed(2)
              : info.frequency.toFixed(4);
            const sourceMap = {
              'api': t('sourceAPI'),
              'local': t('sourceLocalDB'),
              'korean-api': t('sourceKoreanAPI')
            };
            const sourceLabel = sourceMap[info.frequencySource] || t('sourceAPI');
            frequencyDiv.textContent = `${t('frequency')}: ${freqDisplay} ${t('perMillion')} (${sourceLabel})`;
            frequencyDiv.title = `Source: ${info.frequencySource || 'unknown'}`;
          } else {
            frequencyDiv.textContent = `${t('frequency')}: ${t('frequencyNA')}`;
            frequencyDiv.style.fontStyle = 'italic';
          }

          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = t('deleteButton');
          deleteBtn.className = 'delete-btn';
          deleteBtn.style.position = 'absolute';
          deleteBtn.style.top = '10px';
          deleteBtn.style.right = '0px';
          deleteBtn.style.background = 'transparent';
          deleteBtn.style.border = 'none';
          deleteBtn.style.cursor = 'pointer';
          deleteBtn.style.fontSize = '16px';
          deleteBtn.style.color = '#ff4444';
          deleteBtn.style.fontWeight = 'bold';
          deleteBtn.style.opacity = '0.5';
          deleteBtn.style.transition = 'opacity 0.2s';
          deleteBtn.onmouseover = () => deleteBtn.style.opacity = '1';
          deleteBtn.onmouseout = () => deleteBtn.style.opacity = '0.5';
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteWord(word, rarity);
          };

          const infoBtn = document.createElement('button');
          infoBtn.textContent = t('infoButton');
          infoBtn.className = 'info-btn';
          // Style like delete button (text, transparent bg)
          infoBtn.style.background = 'transparent';
          infoBtn.style.border = 'none';
          infoBtn.style.cursor = 'pointer';
          infoBtn.style.fontSize = '11px'; // Slightly smaller than title
          infoBtn.style.color = '#888'; 
          infoBtn.style.fontWeight = 'bold';
          infoBtn.style.padding = '0';
          infoBtn.style.marginTop = '4px';
          infoBtn.style.marginBottom = '2px';
          infoBtn.style.display = 'block'; // Ensure it sits on its own line
          infoBtn.style.opacity = '0.8';
          infoBtn.style.transition = 'opacity 0.2s, color 0.2s';
          
          infoBtn.onmouseover = () => {
            infoBtn.style.opacity = '1';
            infoBtn.style.color = '#555';
          };
          infoBtn.onmouseout = () => {
            infoBtn.style.opacity = '0.8';
            infoBtn.style.color = '#888';
          };
          infoBtn.onclick = (e) => {
            e.stopPropagation();
            showWordContext(word, info);
          };

          div.appendChild(wordStrong);
          div.appendChild(metaRow);
          div.appendChild(infoBtn); // Inserted before description
          div.appendChild(originDiv);
          div.appendChild(frequencyDiv);
          div.appendChild(deleteBtn);

          dexDiv.appendChild(div);
        });
      }

      // Display stats using global function from stats.js
      const total = entries.length;
      const commonCount = stats.common || 0;
      const uncommonCount = stats.uncommon || 0;
      const rareCount = stats.rare || 0;
      const epicCount = stats.epic || 0;
      const legendaryCount = stats.legendary || 0;
      const mythicCount = stats.mythic || 0;

      const streakData = data.streakData || { currentStreak: 0, longestStreak: 0 };

      statsDiv.innerHTML = '';

      const statsStrong = document.createElement('strong');
      statsStrong.textContent = t('collectionStats');

      const statsP = document.createElement('p');
      statsP.style.margin = '8px 0 0 0';
      statsP.appendChild(statsStrong);
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('totalWords')}: ${total}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createElement('br'));

      // Streak display
      const streakSpan = document.createElement('span');
      streakSpan.style.fontWeight = 'bold';
      streakSpan.className = 'streak-text';
      streakSpan.style.color = streakData.currentStreak >= 7 ? '#fffa96' : streakData.currentStreak >= 3 ? '#96c7ff' : '';
      const dayText = streakData.currentStreak !== 1 ? t('days') : t('day');
      streakSpan.textContent = `${t('streak')}: ${streakData.currentStreak} ${dayText}`;
      statsP.appendChild(streakSpan);
      statsP.appendChild(document.createElement('br'));

      if (streakData.longestStreak > 0) {
        const longestDayText = streakData.longestStreak !== 1 ? t('days') : t('day');
        statsP.appendChild(document.createTextNode(`${t('longest')}: ${streakData.longestStreak} ${longestDayText}`));
        statsP.appendChild(document.createElement('br'));
      }

      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('COMMON')}: ${commonCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('UNCOMMON')}: ${uncommonCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('RARE')}: ${rareCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('EPIC')}: ${epicCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('LEGENDARY')}: ${legendaryCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('MYTHIC')}: ${mythicCount}`));

      statsDiv.appendChild(statsP);

      if (typeof displayCharts !== 'undefined') {
        displayCharts(data.wordDex || {}, stats);
      }
      if (typeof displayBadges !== 'undefined') {
        displayBadges(data.badges || { main: [], hidden: [] });
      }

    } catch (err) {
      console.error('Error displaying word dex:', err);
      displayError("Error displaying words. Please try refreshing.");
    }
  });
}

function showWordContext(word, info) {
  // Create Modal
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0,0,0,0.5)';
  overlay.style.zIndex = '10000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  const modal = document.createElement('div');
  modal.style.background = '#fff';
  modal.style.padding = '24px';
  modal.style.borderRadius = '16px';
  modal.style.maxWidth = '90%';
  modal.style.width = '400px';
  modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
  modal.style.fontFamily = 'inherit';
  modal.style.position = 'relative';

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '12px';
  closeBtn.style.right = '12px';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#999';
  closeBtn.onclick = () => overlay.remove();

  const title = document.createElement('h2');
  title.textContent = word;
  title.style.margin = '0 0 16px 0';
  title.style.color = rarityScale[info.rarity] || '#333';
  if (info.rarity === 'god') {
     title.style.backgroundImage = rarityScale[info.rarity];
     title.style.backgroundSize = '200% auto';
     title.style.webkitBackgroundClip = 'text';
     title.style.webkitTextFillColor = 'transparent';
     title.style.animation = 'rainbow 2s linear infinite';
  }

  const details = document.createElement('div');
  details.style.fontSize = '14px';
  details.style.lineHeight = '1.6';
  details.style.color = '#555';

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString();
  };

  const firstDate = formatDate(info.firstCaught || info.timestamp);
  const lastDate = formatDate(info.timestamp);
  const caughtOn = info.caughtOn || 'Unknown';
  
  // Highlight word in context
  let contextHtml = '<em>No context available.</em>';
  if (info.context) {
      // Escape HTML first
      const escapedContext = escapeHtml(info.context);
      // Create regex to match word (case insensitive)
      const regex = new RegExp(`(${word})`, 'gi');
      
      let highlightStyle = `color: ${rarityScale[info.rarity] || '#000'}; font-weight: bold;`;
      if (info.rarity === 'god') {
          // For god tier text, we can't easily do gradient text in inline replacement without more complex HTML
          // So just use a fallback color or simple style
          highlightStyle = `color: #ff00ff; font-weight: bold; text-shadow: 0 0 5px rgba(255,0,255,0.3);`;
      }
      
      contextHtml = escapedContext.replace(regex, `<span style="${highlightStyle}">$1</span>`);
  }

  details.innerHTML = `
    <div style="margin-bottom: 8px;"><strong>First Caught:</strong> ${firstDate}</div>
    <div style="margin-bottom: 8px;"><strong>Last Caught:</strong> ${lastDate}</div>
    <div style="margin-bottom: 16px;"><strong>Caught On:</strong> ${caughtOn}</div>
    <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; border-left: 4px solid ${rarityScale[info.rarity] || '#ccc'};">
        <strong>Context:</strong><br/>
        <span style="font-style: italic;">"${contextHtml}"</span>
    </div>
  `;

  // Tag Management Section
  const tagContainer = document.createElement('div');
  tagContainer.className = 'tag-input-container';
  
  const tagList = document.createElement('div');
  tagList.className = 'tag-list';
  
  const renderTags = () => {
      tagList.innerHTML = '';
      const currentTags = info.tags || [];
      currentTags.forEach(tag => {
          const chip = document.createElement('div');
          chip.className = 'tag-chip';
          chip.innerHTML = `${tag} <button data-tag="${tag}">&times;</button>`;
          chip.querySelector('button').onclick = () => removeTag(word, tag);
          tagList.appendChild(chip);
      });
  };
  renderTags();

  const addRow = document.createElement('div');
  addRow.className = 'tag-add-row';
  
  const input = document.createElement('input');
  input.id = 'newTagInput';
  input.placeholder = 'Add tag...';
  input.setAttribute('list', 'existingTags'); // Datalist for suggestions

  const addBtn = document.createElement('button');
  addBtn.id = 'addTagBtn';
  addBtn.textContent = 'Add';
  addBtn.onclick = () => {
      const newTag = input.value.trim();
      if(newTag) {
          addTag(word, newTag);
          input.value = '';
      }
  };

  addRow.appendChild(input);
  addRow.appendChild(addBtn);
  
  tagContainer.appendChild(tagList);
  tagContainer.appendChild(addRow);
  details.appendChild(tagContainer);

  modal.appendChild(closeBtn);
  modal.appendChild(title);
  modal.appendChild(details);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Populate Datalist for Autocomplete
  chrome.storage.local.get(['wordDex'], (data) => {
      const allTags = new Set();
      Object.values(data.wordDex || {}).forEach(w => {
          if(w.tags) w.tags.forEach(t => allTags.add(t));
      });
      
      let datalist = document.getElementById('existingTags');
      if(!datalist) {
          datalist = document.createElement('datalist');
          datalist.id = 'existingTags';
          document.body.appendChild(datalist);
      }
      datalist.innerHTML = '';
      allTags.forEach(tag => {
          const option = document.createElement('option');
          option.value = tag;
          datalist.appendChild(option);
      });
  });

  // Tag Actions
  const addTag = (targetWord, tag) => {
      chrome.storage.local.get(['wordDex'], (data) => {
          const dex = data.wordDex || {};
          if(dex[targetWord]) {
              if(!dex[targetWord].tags) dex[targetWord].tags = [];
              if(!dex[targetWord].tags.includes(tag)) {
                  dex[targetWord].tags.push(tag);
                  chrome.storage.local.set({ wordDex: dex }, () => {
                      info.tags = dex[targetWord].tags; // Update local reference
                      renderTags();
                      displayWordDex(currentSort); // Update background list
                  });
              }
          }
      });
  };

  const removeTag = (targetWord, tag) => {
      chrome.storage.local.get(['wordDex'], (data) => {
          const dex = data.wordDex || {};
          if(dex[targetWord] && dex[targetWord].tags) {
              dex[targetWord].tags = dex[targetWord].tags.filter(t => t !== tag);
              chrome.storage.local.set({ wordDex: dex }, () => {
                  info.tags = dex[targetWord].tags; // Update local reference
                  renderTags();
                  displayWordDex(currentSort);
              });
          }
      });
  };
}

function displayError(message) {
  const dexDiv = document.getElementById("dex");
  if (dexDiv) {
    dexDiv.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">${escapeHtml(message)}</p>`;
  }
}

function setupSortButtons() {
  const buttons = document.querySelectorAll('.sort-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sortType = btn.getAttribute('data-sort');
      
      if (sortType === 'tag') {
          showTagFilterMenu();
          return;
      }
      
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Clear tag filter if switching sort? 
      // User might want to sort filtered list. 
      // If we switch to 'rarity', we keep the filter but change sort order? 
      // The requirement says "Order by tag should also allow you to select by which tag".
      // Let's assume 'Tag' button is SPECIAL -> It sets filter.
      // Other buttons set SORT order.
      
      currentSort = sortType;
      displayWordDex(sortType);
    });
  });
}

function showTagFilterMenu() {
    chrome.storage.local.get(['wordDex'], (data) => {
        const dex = data.wordDex || {};
        const allTags = new Set();
        Object.values(dex).forEach(w => {
            if(w.tags) w.tags.forEach(t => allTags.add(t));
        });
        
        const tags = Array.from(allTags).sort();
        const rarities = ['god', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        
        // Create a simple modal or overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '20000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
        
        const modal = document.createElement('div');
        modal.style.background = '#fff';
        modal.style.padding = '16px';
        modal.style.borderRadius = '8px';
        modal.style.width = '240px';
        modal.style.maxHeight = '400px';
        modal.style.overflowY = 'auto';
        
        const title = document.createElement('h3');
        title.textContent = t('filterMenuTitle');
        title.style.marginTop = '0';
        modal.appendChild(title);
        
        const createBtn = (text, onClick, isBold = false, color = null) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.display = 'block';
            btn.style.width = '100%';
            btn.style.padding = '10px';
            btn.style.textAlign = 'left';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.cursor = 'pointer';
            btn.style.borderBottom = '1px solid #eee';
            if(isBold) btn.style.fontWeight = 'bold';
            if(color) btn.style.color = color;
            
            btn.onclick = () => {
                onClick();
                overlay.remove();
            };
            return btn;
        };

        // 1. Sorting Options
        const sortLabel = document.createElement('div');
        sortLabel.textContent = t('sortView');
        sortLabel.style.fontSize = '11px';
        sortLabel.style.fontWeight = 'bold';
        sortLabel.style.color = '#999';
        sortLabel.style.marginTop = '8px';
        sortLabel.style.marginBottom = '4px';
        modal.appendChild(sortLabel);

        // Sort by Tags
        modal.appendChild(createBtn(t('sortByTags'), () => {
            currentTagFilter = null;
            currentSort = 'tag';
            displayWordDex('tag');
            updateActiveSortButton('tag');
        }, true));

        // 2. Unified Filter List
        const filterLabel = document.createElement('div');
        filterLabel.textContent = t('filterByTag');
        filterLabel.style.fontSize = '11px';
        filterLabel.style.fontWeight = 'bold';
        filterLabel.style.color = '#999';
        filterLabel.style.marginTop = '12px';
        filterLabel.style.marginBottom = '4px';
        modal.appendChild(filterLabel);

        // Add Rarities as Tags
        rarities.forEach(r => {
            const rColor = rarityScale[r] || '#333';
            modal.appendChild(createBtn(t(r.toUpperCase()), () => { // Use t() for translated rarity names
                currentTagFilter = r; // Treat rarity as a tag
                displayWordDex(currentSort); 
                updateActiveSortButton('tag');
            }, false, rColor));
        });

        // Add Custom Tags
        if (tags.length > 0) {
            tags.forEach(tag => {
                modal.appendChild(createBtn(tag, () => {
                    currentTagFilter = tag;
                    displayWordDex(currentSort);
                    updateActiveSortButton('tag');
                }));
            });
        }
        
        // Clear Filter Button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = t('clearFilter');
        clearBtn.style.width = '100%';
        clearBtn.style.marginTop = '16px';
        clearBtn.style.padding = '10px';
        clearBtn.style.background = '#f5f5f5';
        clearBtn.style.border = 'none';
        clearBtn.style.borderRadius = '4px';
        clearBtn.style.cursor = 'pointer';
        clearBtn.style.fontWeight = 'bold';
        clearBtn.onclick = () => {
            currentTagFilter = null;
            displayWordDex(currentSort);
            overlay.remove();
        };
        modal.appendChild(clearBtn);
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
}

function updateActiveSortButton(type) {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    // If type is 'tag', highlight tag button. 
    // If type is 'rarity', we don't have a button, so maybe highlight 'Tag' as it's the "Advanced" menu?
    // Or just highlight nothing?
    // The previous code highlighted 'tag' for all menu actions.
    const btn = document.querySelector(`.sort-btn[data-sort="${type}"]`) || document.querySelector(`.sort-btn[data-sort="tag"]`);
    if(btn) btn.classList.add('active');
}

function addTagGlobal(word, tag) {
   chrome.storage.local.get(['wordDex'], (data) => {
      const dex = data.wordDex || {};
      if(dex[word]) {
          if(!dex[word].tags) dex[word].tags = [];
          if(!dex[word].tags.includes(tag)) {
              dex[word].tags.push(tag);
              chrome.storage.local.set({ wordDex: dex }, () => {
                  displayWordDex(currentSort);
              });
          }
      }
  });
}

function removeTagGlobal(word, tag) {
   chrome.storage.local.get(['wordDex'], (data) => {
      const dex = data.wordDex || {};
      if(dex[word] && dex[word].tags) {
          dex[word].tags = dex[word].tags.filter(t => t !== tag);
          chrome.storage.local.set({ wordDex: dex }, () => {
              displayWordDex(currentSort);
          });
      }
  });
}

function setupSearchBar() {
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      displayWordDex(currentSort);
    });
  }
}

function deleteWord(word, rarity) {
  if (!confirm(t('deleteConfirm', { word }))) {
    return;
  }

  chrome.storage.local.get(['wordDex', 'achievements'], (data) => {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      return;
    }

    const wordDex = data.wordDex || {};
    const achievements = data.achievements || {};

    if (wordDex[word]) {
      delete wordDex[word];

      if (achievements[rarity] && achievements[rarity] > 0) {
        achievements[rarity] -= 1;
      }

      chrome.storage.local.set({ wordDex, achievements }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage save error:', chrome.runtime.lastError);
          return;
        }
        displayWordDex(currentSort);
      });
    }
  });
}

// Expose globals
window.escapeHtml = escapeHtml;
window.displayWordDex = displayWordDex;
window.setupSortButtons = setupSortButtons;
window.setupSearchBar = setupSearchBar;
window.currentSort = currentSort;
window.showWordContext = showWordContext;
