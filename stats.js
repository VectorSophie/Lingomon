// stats.js - Handles Charts and Badges Visualization

function displayCharts(wordDex, achievements) {
  const statsDiv = document.getElementById('stats');
  if (!statsDiv) return;

  // Words caught per day graph (last 7 days)
  const wordsPerDay = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    wordsPerDay[dateStr] = 0;
  }

  // Count words per day
  Object.values(wordDex).forEach(word => {
    if (word.firstCaught) {
      const wordDate = new Date(word.firstCaught);
      wordDate.setHours(0, 0, 0, 0);
      const dateStr = wordDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (wordsPerDay.hasOwnProperty(dateStr)) {
        wordsPerDay[dateStr]++;
      }
    }
  });

  // Create graph
  const graphDiv = document.createElement('div');
  graphDiv.style.marginTop = '16px';
  graphDiv.style.paddingTop = '16px';
  graphDiv.style.borderTop = '1px solid #e0e0e0';

  const graphTitle = document.createElement('strong');
  graphTitle.textContent = t('wordsCaughtLast7Days');
  graphTitle.style.display = 'block';
  graphTitle.style.marginBottom = '8px';
  graphDiv.appendChild(graphTitle);

  const maxCount = Math.max(...Object.values(wordsPerDay), 1);

  Object.entries(wordsPerDay).forEach(([date, count]) => {
    const barContainer = document.createElement('div');
    barContainer.style.display = 'flex';
    barContainer.style.alignItems = 'center';
    barContainer.style.marginBottom = '4px';

    const label = document.createElement('span');
    label.textContent = date;
    label.style.fontSize = '11px';
    label.style.width = '60px';
    label.style.flexShrink = '0';
    barContainer.appendChild(label);

    const barBg = document.createElement('div');
    barBg.style.flex = '1';
    barBg.style.height = '16px';
    barBg.style.background = '#e0e0e0';
    barBg.style.borderRadius = '3px';
    barBg.style.overflow = 'hidden';
    barBg.style.marginRight = '8px';

    const bar = document.createElement('div');
    bar.style.height = '100%';
    bar.style.width = `${(count / maxCount) * 100}%`;
    bar.style.background = 'linear-gradient(90deg, #96c7ff, #b996ff)';
    bar.style.transition = 'width 0.3s ease';
    barBg.appendChild(bar);

    barContainer.appendChild(barBg);

    const countLabel = document.createElement('span');
    countLabel.textContent = count;
    countLabel.style.fontSize = '11px';
    countLabel.style.width = '20px';
    countLabel.style.textAlign = 'right';
    barContainer.appendChild(countLabel);

    graphDiv.appendChild(barContainer);
  });

  statsDiv.appendChild(graphDiv);

  // Rarity distribution pie chart
  const pieDiv = document.createElement('div');
  pieDiv.style.marginTop = '16px';
  pieDiv.style.paddingTop = '16px';
  pieDiv.style.borderTop = '1px solid #e0e0e0';

  const pieTitle = document.createElement('strong');
  pieTitle.textContent = t('rarityDistribution');
  pieTitle.style.display = 'block';
  pieTitle.style.marginBottom = '8px';
  pieDiv.appendChild(pieTitle);

    // Sort by count (percentage) in descending order, exclude 'god' from stats
    const sortedAchievements = Object.entries(achievements)
      .filter(([rarity, count]) => count > 0 && rarity !== 'god')
      .sort((a, b) => b[1] - a[1]);

    const total = sortedAchievements.reduce((sum, [_, count]) => sum + count, 0);

    if (total > 0) {
      const rarityColors = {
        common: '#ebebeb',
        uncommon: '#a1ff96',
        rare: '#96c7ff',
        epic: '#b996ff',
        legendary: '#fffa96',
        mythic: '#ff6969'
      };

      const pieSegments = document.createElement('div');
      pieSegments.style.display = 'flex';
      pieSegments.style.height = '20px';
      pieSegments.style.borderRadius = '10px';
      pieSegments.style.overflow = 'hidden';
      pieSegments.style.marginBottom = '8px';

      sortedAchievements.forEach(([rarity, count]) => {
        const percent = (count / total) * 100;
        const segment = document.createElement('div');
        segment.style.width = `${percent}%`;
        segment.style.background = rarityColors[rarity] || '#cccccc';
        segment.title = `${rarity}: ${count} (${percent.toFixed(1)}%)`;
        pieSegments.appendChild(segment);
      });

      pieDiv.appendChild(pieSegments);

    // Legend
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.gap = '8px';
    legend.style.fontSize = '11px';

    sortedAchievements.forEach(([rarity, count]) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '4px';

      const box = document.createElement('div');
      box.style.width = '12px';
      box.style.height = '12px';
      box.style.background = rarityColors[rarity] || '#cccccc';
      box.style.borderRadius = '2px';
      item.appendChild(box);

      const text = document.createElement('span');
      const percent = ((count / total) * 100).toFixed(1);
      text.textContent = `${t(rarity.toUpperCase())}: ${percent}%`;
      item.appendChild(text);

      legend.appendChild(item);
    });

    pieDiv.appendChild(legend);
  }

  statsDiv.appendChild(pieDiv);
}

function displayBadges(badges) {
  const badgesDiv = document.getElementById('badges');
  if (!badgesDiv) return;

  badgesDiv.innerHTML = '';

  if (badges.main && badges.main.length > 0) {
    const mainSection = document.createElement('div');
    mainSection.className = 'badge-section';

    const mainTitle = document.createElement('strong');
    mainTitle.textContent = t('achievements');
    mainSection.appendChild(mainTitle);

    const container = document.createElement('div');
    container.className = 'badge-container';

    badges.main.forEach(badge => {
      const badgeWrapper = document.createElement('div');
      badgeWrapper.style.textAlign = 'center';

      const hexagon = document.createElement('div');
      hexagon.className = 'badge-hexagon';
      const badgeName = badge.nameKey ? t(badge.nameKey) : badge.name;
      const nextName = badge.next ? (badge.next.nameKey ? t(badge.next.nameKey) : badge.next.name) : null;
      hexagon.title = badgeName + (nextName ? ` - ${t('nextBadge')} ${nextName}` : ` - ${t('maxLevel')}`);

      const color = rarityScale[badge.rarity] || '#cccccc';
      hexagon.style.setProperty('--badge-color', color);
      hexagon.style.background = color;

      const content = document.createElement('div');
      content.className = 'badge-content';
      content.textContent = badgeName;
      hexagon.appendChild(content);

      badgeWrapper.appendChild(hexagon);

      if (badge.next) {
        const progress = document.createElement('div');
        progress.className = 'badge-progress';
        progress.textContent = `${badge.current} / ${badge.next.threshold}`;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = Math.min(badge.progress, 100) + '%';
        progressFill.style.background = color;

        progressBar.appendChild(progressFill);
        badgeWrapper.appendChild(progress);
        badgeWrapper.appendChild(progressBar);
      }

      container.appendChild(badgeWrapper);
    });

    mainSection.appendChild(container);
    badgesDiv.appendChild(mainSection);
  }

  if (badges.hidden && badges.hidden.length > 0) {
    const hiddenSection = document.createElement('div');
    hiddenSection.className = 'badge-section';

    const hiddenTitle = document.createElement('strong');
    hiddenTitle.textContent = t('hiddenBadges');
    hiddenSection.appendChild(hiddenTitle);

    const container = document.createElement('div');
    container.className = 'badge-container';

    badges.hidden.forEach(badge => {
      const badgeWrapper = document.createElement('div');
      badgeWrapper.style.textAlign = 'center';

      const hexagon = document.createElement('div');
      hexagon.className = 'badge-hexagon';

      // Translate hidden badge names
      let badgeName = badge.name;
      if (badge.type === 'firstMythic') {
        badgeName = t('firstMythic');
      } else if (badge.type === 'meta') {
        badgeName = t('meta');
      } else if (badge.type === 'huh') {
        badgeName = t('huh');
      } else if (badge.type === 'rarityKiller') {
        const killerKey = `${badge.rarity}Killer`;
        badgeName = t(killerKey);
      }

      hexagon.title = badgeName + (badge.count ? ` (${badge.count})` : '');

      // Meta badge gets special black color, Huh??? badge gets rainbow
      let color = rarityScale[badge.rarity] || '#cccccc';
      if (badge.type === 'meta') {
        color = '#000000';
      } else if (badge.type === 'huh') {
        color = 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)';
      }
      
      hexagon.style.setProperty('--badge-color', color);
      hexagon.style.background = color;

      if (badge.type === 'huh') {
        hexagon.style.backgroundSize = '400% 400%';
        hexagon.style.animation = 'gradient-shift 3s ease infinite';
      }

      const content = document.createElement('div');
      content.className = 'badge-content';
      content.textContent = badgeName;
      hexagon.appendChild(content);

      badgeWrapper.appendChild(hexagon);
      container.appendChild(badgeWrapper);
    });

    hiddenSection.appendChild(container);
    badgesDiv.appendChild(hiddenSection);
  }
}

// Expose to global scope
window.displayCharts = displayCharts;
window.displayBadges = displayBadges;
