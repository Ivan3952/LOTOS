var app = document.getElementById("app");
var lightbox = document.getElementById("lightbox");
var lightboxImg = document.getElementById("lightbox-img");
var lightboxClose = document.querySelector(".lightbox__close");
var lightboxCaption = document.getElementById("lightbox-caption");
var musicButton = document.getElementById("music-toggle");
var bgMusic = document.getElementById("bg-music");

var currentPage = 0;
var currentWinnersPage = 0;
var currentCommentsPage = 0;
var WORKS_PER_PAGE = 12;
var WINNERS_PER_PAGE = 12;
var COMMENTS_PER_PAGE = 16;
var isRouting = false;
var currentSort = "score";
var currentFilter = "all";
var currentView = "cards";
var currentSearch = "";

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getEventTitle() {
  return typeof EVENT !== "undefined" && EVENT.title ? EVENT.title : "LOTOS";
}

function formatTokens(value) {
  return String(Number(value || 0).toLocaleString("ru-RU")) + " токенов";
}

function formatScore(value) {
  var n = Number(value || 0);
  return String(Number.isInteger(n) ? n : n.toFixed(1).replace(".", ","));
}

function scoreLabel(work) {
  var max = Number(work && work.scoreMax ? work.scoreMax : 5);
  return formatScore(work && work.score) + "/" + max;
}

function getScore(work) {
  return Number(work.score || 0);
}

function getReward(work) {
  return Number(work.reward || 0);
}

function getWinners() {
  return WORKS.filter(function(work) {
    return work.isWinner;
  }).sort(function(a, b) {
    if (Number(a.place || 999) !== Number(b.place || 999)) {
      return Number(a.place || 999) - Number(b.place || 999);
    }
    if (getScore(b) !== getScore(a)) return getScore(b) - getScore(a);
    return getReward(b) - getReward(a);
  });
}

function getWorksWithComments() {
  return WORKS.filter(function(work) {
    return String(work.comment || "").trim().length > 0;
  }).sort(function(a, b) {
    if (getScore(b) !== getScore(a)) return getScore(b) - getScore(a);
    return Number(a.id || 0) - Number(b.id || 0);
  });
}

function getAverageScore(works) {
  if (!works.length) return 0;
  return works.reduce(function(sum, work) {
    return sum + getScore(work);
  }, 0) / works.length;
}

function getTotalReward(works) {
  return works.reduce(function(sum, work) {
    return sum + getReward(work);
  }, 0);
}

function getFilteredAndSortedWorks() {
  var works = WORKS.slice();

  if (currentFilter === "winners") {
    works = works.filter(function(work) {
      return work.isWinner;
    });
  }

  if (currentSearch.trim()) {
    var q = currentSearch.trim().toLowerCase();
    works = works.filter(function(work) {
      return String(work.username || "").toLowerCase().includes(q) ||
        String(work.title || "").toLowerCase().includes(q) ||
        String(work.awardTitle || "").toLowerCase().includes(q) ||
        String(work.comment || "").toLowerCase().includes(q);
    });
  }

  if (currentSort === "new") {
    works.sort(function(a, b) {
      return Number(b.id || 0) - Number(a.id || 0);
    });
  } else if (currentSort === "reward") {
    works.sort(function(a, b) {
      if (getReward(b) !== getReward(a)) return getReward(b) - getReward(a);
      return getScore(b) - getScore(a);
    });
  } else {
    works.sort(function(a, b) {
      if (getScore(b) !== getScore(a)) return getScore(b) - getScore(a);
      return getReward(b) - getReward(a);
    });
  }

  return works;
}

function getRouteFromUrl() {
  return new URLSearchParams(window.location.search).get("page") || "home";
}

function urlFor(route) {
  return route === "home" ? window.location.pathname : window.location.pathname + "?page=" + route;
}

function setAppHtml(html) {
  app.innerHTML = html;
}

function renderStatsBlock() {
  return '<div class="stats-strip">' +
    '<div><span>Работ</span><b>' + WORKS.length + '</b></div>' +
    '<div><span>Победителей</span><b>' + getWinners().length + '</b></div>' +
    '<div><span>Комментариев</span><b>' + getWorksWithComments().length + '</b></div>' +
    '<div><span>Фонд</span><b>' + formatTokens(getTotalReward(WORKS)) + '</b></div>' +
  '</div>';
}

function renderHome() {
  setAppHtml(
    '<section class="home poster-home">' +
      '<div class="poster-copy">' +
        '<h1>' + escapeHtml(getEventTitle()) + '</h1>' +
        '<p class="poster-subtitle">Итоги ивента</p>' +
        '<p class="poster-line">работы участников • оценки • комментарии жюри</p>' +
        '<a class="primary-action poster-action" href="' + urlFor("results") + '" data-route="results">Открыть архив →</a>' +
      '</div>' +
    '</section>'
  );
}

function renderResultsMenu() {
  setAppHtml(
    '<section class="page results-page">' +
      renderStatsBlock() +
      '<div class="line-menu">' +
        '<a class="line-menu-item" href="' + urlFor("participants") + '" data-route="participants">' +
          '<span>01</span><b>Победители</b><em>участники и токены</em>' +
        '</a>' +
        '<a class="line-menu-item" href="' + urlFor("all") + '" data-route="all">' +
          '<span>02</span><b>Все работы</b><em>' + WORKS.length + ' работ · есть режим галереи</em>' +
        '</a>' +
        '<a class="line-menu-item" href="' + urlFor("comments") + '" data-route="comments">' +
          '<span>03</span><b>Комментарии</b><em>' + getWorksWithComments().length + ' записей</em>' +
        '</a>' +
        '<a class="line-menu-item" href="#" id="random-work-card">' +
          '<span>04</span><b>Случайная работа</b><em>открыть арт</em>' +
        '</a>' +
      '</div>' +
    '</section>'
  );

  var randomCard = document.getElementById("random-work-card");
  if (randomCard) {
    randomCard.onclick = function(event) {
      event.preventDefault();
      openRandomWork();
    };
  }
}

function renderWinners() {
  currentWinnersPage = 0;
  renderWinnersPage();
}

function renderWinnersPage() {
  var winners = getWinners();
  var totalPages = Math.max(1, Math.ceil(winners.length / WINNERS_PER_PAGE));
  var start = currentWinnersPage * WINNERS_PER_PAGE;
  var pageWinners = winners.slice(start, start + WINNERS_PER_PAGE);

  setAppHtml(
    '<section class="page">' +
      '<div class="section-title"><a class="back" href="' + urlFor("results") + '" data-route="results">← Назад</a><h2>Победители</h2></div>' +
      (winners.length ? '<div class="scroll-list winners-list">' + pageWinners.map(renderWorkCard).join("") + '</div>' : '<div class="empty">Победители пока не добавлены.</div>') +
      '<div class="pagination"><button class="ghost-btn" id="prev-winners-page">← Назад</button><span class="page-counter">' + (currentWinnersPage + 1) + ' / ' + totalPages + '</span><button class="primary-action small" id="next-winners-page">Дальше →</button></div>' +
    '</section>'
  );

  var prev = document.getElementById("prev-winners-page");
  var next = document.getElementById("next-winners-page");

  if (prev) {
    prev.disabled = currentWinnersPage === 0;
    prev.onclick = function() {
      if (currentWinnersPage > 0) {
        currentWinnersPage--;
        renderWinnersPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  }

  if (next) {
    next.disabled = currentWinnersPage >= totalPages - 1;
    next.onclick = function() {
      if (currentWinnersPage < totalPages - 1) {
        currentWinnersPage++;
        renderWinnersPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  }

  attachImageHandlers();
  attachShareHandlers();
}

function renderAllWorks() {
  currentPage = 0;
  renderAllWorksPage();
}

function renderAllWorksPage() {
  var works = getFilteredAndSortedWorks();
  var totalPages = Math.max(1, Math.ceil(works.length / WORKS_PER_PAGE));
  var start = currentPage * WORKS_PER_PAGE;
  var pageWorks = works.slice(start, start + WORKS_PER_PAGE);
  var gridClass = currentView === "gallery" ? "masonry gallery-grid" : "scroll-list";

  setAppHtml(
    '<section class="page">' +
      '<div class="section-title"><a class="back" href="' + urlFor("results") + '" data-route="results">← Назад</a><h2>Все работы</h2></div>' +
      '<div class="toolbar">' +
        '<input class="search-input" id="search-input" placeholder="Найти автора / комментарий..." value="' + escapeHtml(currentSearch) + '">' +
        '<button class="filter-btn ' + (currentSort === "score" ? "is-active" : "") + '" data-sort="score">Лучшие</button>' +
        '<button class="filter-btn ' + (currentSort === "new" ? "is-active" : "") + '" data-sort="new">Новые</button>' +
        '<button class="filter-btn ' + (currentSort === "reward" ? "is-active" : "") + '" data-sort="reward">Награда</button>' +
        '<button class="filter-btn ' + (currentFilter === "winners" ? "is-active" : "") + '" data-filter="winners">Победители</button>' +
        '<button class="filter-btn ' + (currentFilter === "all" ? "is-active" : "") + '" data-filter="all">Все</button>' +
        '<button class="filter-btn ' + (currentView === "cards" ? "is-active" : "") + '" data-view="cards">Свитки</button>' +
        '<button class="filter-btn ' + (currentView === "gallery" ? "is-active" : "") + '" data-view="gallery">Галерея</button>' +
        '<button class="filter-btn" id="random-work-button">Случайная</button>' +
      '</div>' +
      (works.length ? '<div class="' + gridClass + '">' + pageWorks.map(renderWorkCard).join("") + '</div>' : '<div class="empty">Работы не найдены.</div>') +
      '<div class="pagination"><button class="ghost-btn" id="prev-page">← Назад</button><span class="page-counter">' + (currentPage + 1) + ' / ' + totalPages + '</span><button class="primary-action small" id="next-page">Дальше →</button></div>' +
    '</section>'
  );

  setupToolbar();

  var prev = document.getElementById("prev-page");
  var next = document.getElementById("next-page");

  if (prev) {
    prev.disabled = currentPage === 0;
    prev.onclick = function() {
      if (currentPage > 0) {
        currentPage--;
        renderAllWorksPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  }

  if (next) {
    next.disabled = currentPage >= totalPages - 1;
    next.onclick = function() {
      if (currentPage < totalPages - 1) {
        currentPage++;
        renderAllWorksPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  }

  var randomButton = document.getElementById("random-work-button");
  if (randomButton) randomButton.onclick = openRandomWork;

  attachImageHandlers();
  attachShareHandlers();
  openWorkFromUrlIfNeeded();
}

function renderComments() {
  currentCommentsPage = 0;
  renderCommentsPage();
}

function renderCommentsPage() {
  var works = getWorksWithComments();

  if (currentSearch.trim()) {
    var q = currentSearch.trim().toLowerCase();
    works = works.filter(function(work) {
      return String(work.username || "").toLowerCase().includes(q) ||
        String(work.comment || "").toLowerCase().includes(q) ||
        String(work.title || "").toLowerCase().includes(q);
    });
  }

  var totalPages = Math.max(1, Math.ceil(works.length / COMMENTS_PER_PAGE));
  var start = currentCommentsPage * COMMENTS_PER_PAGE;
  var pageWorks = works.slice(start, start + COMMENTS_PER_PAGE);

  setAppHtml(
    '<section class="page comments-page">' +
      '<div class="section-title"><a class="back" href="' + urlFor("results") + '" data-route="results">← Назад</a><h2>Комментарии</h2></div>' +
      '<div class="toolbar comments-toolbar"><input class="search-input" id="comments-search-input" placeholder="Найти автора / текст комментария..." value="' + escapeHtml(currentSearch) + '"></div>' +
      (works.length ? '<div class="comments-list">' + pageWorks.map(renderCommentItem).join("") + '</div>' : '<div class="empty">Комментарии не найдены.</div>') +
      '<div class="pagination"><button class="ghost-btn" id="prev-comments-page">← Назад</button><span class="page-counter">' + (currentCommentsPage + 1) + ' / ' + totalPages + '</span><button class="primary-action small" id="next-comments-page">Дальше →</button></div>' +
    '</section>'
  );

  var input = document.getElementById("comments-search-input");
  if (input) {
    input.oninput = function() {
      currentSearch = input.value;
      currentCommentsPage = 0;
      renderCommentsPage();
    };
  }

  var prev = document.getElementById("prev-comments-page");
  var next = document.getElementById("next-comments-page");

  if (prev) {
    prev.disabled = currentCommentsPage === 0;
    prev.onclick = function() {
      if (currentCommentsPage > 0) {
        currentCommentsPage--;
        renderCommentsPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  }

  if (next) {
    next.disabled = currentCommentsPage >= totalPages - 1;
    next.onclick = function() {
      if (currentCommentsPage < totalPages - 1) {
        currentCommentsPage++;
        renderCommentsPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  }

  attachCommentOpenHandlers();
}

function renderCommentItem(work) {
  return '<article class="comment-item" data-comment-work="' + escapeHtml(work.id) + '">' +
    '<div class="comment-head">' +
      '<a class="comment-author" href="?page=author&name=' + getAuthorSlug(work.username) + '" data-route="author&name=' + getAuthorSlug(work.username) + '">' + escapeHtml(work.username) + '</a>' +
      '<span>' + scoreLabel(work) + '</span>' +
    '</div>' +
    '<blockquote>«' + escapeHtml(work.comment || "") + '»</blockquote>' +
    '<div class="comment-actions"><button class="comment-open" type="button" data-comment-open="' + escapeHtml(work.id) + '">Открыть работу →</button><button class="comment-copy" type="button" data-comment-copy="' + escapeHtml(work.id) + '">Скопировать комментарий</button></div>' +
  '</article>';
}

function attachCommentOpenHandlers() {
  document.querySelectorAll("[data-comment-open]").forEach(function(button) {
    button.onclick = function() {
      openWork(findWork(button.getAttribute("data-comment-open")));
    };
  });

  document.querySelectorAll("[data-comment-copy]").forEach(function(button) {
    button.onclick = function() {
      var work = findWork(button.getAttribute("data-comment-copy"));
      if (!work) return;
      var text = work.username + " — " + scoreLabel(work) + "\n\n«" + (work.comment || "") + "»";
      copyText(text, button);
    };
  });
}

function setupToolbar() {
  var input = document.getElementById("search-input");

  if (input) {
    input.oninput = function() {
      currentSearch = input.value;
      currentPage = 0;
      renderAllWorksPage();
    };
  }

  document.querySelectorAll("[data-sort]").forEach(function(button) {
    button.onclick = function() {
      currentSort = button.getAttribute("data-sort");
      currentPage = 0;
      renderAllWorksPage();
    };
  });

  document.querySelectorAll("[data-filter]").forEach(function(button) {
    button.onclick = function() {
      currentFilter = button.getAttribute("data-filter");
      currentPage = 0;
      renderAllWorksPage();
    };
  });

  document.querySelectorAll("[data-view]").forEach(function(button) {
    button.onclick = function() {
      currentView = button.getAttribute("data-view");
      currentPage = 0;
      renderAllWorksPage();
    };
  });
}

function shortComment(text) {
  text = String(text || "");
  if (text.length <= 180) return escapeHtml(text);
  return escapeHtml(text.slice(0, 180)) + "…";
}

function renderWorkCard(work) {
  var winnerBadge = work.isWinner ? '<div class="place-badge">' + (work.place ? work.place + ' место' : 'Победитель') + '</div>' : '';
  var isPlainPlaceTitle = /^(1|2|3) место$/.test(String(work.awardTitle || ""));
  var awardTitle = work.awardTitle && !isPlainPlaceTitle ? '<div class="award-title-badge">' + escapeHtml(work.awardTitle) + '</div>' : '';
  var link = work.postLink ? '<a class="post-link" href="' + escapeHtml(work.postLink) + '" target="_blank" rel="noopener">Пост</a>' : '';
  var galleryClass = currentView === "gallery" ? " is-gallery" : "";
  var comment = work.comment ? '<blockquote class="comment-quote">«' + shortComment(work.comment) + '»</blockquote>' : '';

  return '<article class="work-scroll' + galleryClass + '" id="work-' + escapeHtml(work.id) + '">' +
    '<button class="image-btn" data-image="' + escapeHtml(work.image) + '" data-work-id="' + escapeHtml(work.id) + '" data-alt="' + escapeHtml(work.username) + '">' +
      '<img src="' + escapeHtml(work.image) + '" alt="Работа ' + escapeHtml(work.username) + '" loading="lazy" decoding="async">' + winnerBadge + awardTitle +
    '</button>' +
    '<div class="scroll-body">' +
      '<div class="work-top"><div><h3><a class="author-inline" href="?page=author&name=' + getAuthorSlug(work.username) + '" data-route="author&name=' + getAuthorSlug(work.username) + '">' + escapeHtml(work.username) + '</a></h3><p>' + escapeHtml(work.title || "Работа участника") + '</p></div>' +
      '<div class="work-actions">' + link + '<button class="share-btn" type="button" data-share-id="' + escapeHtml(work.id) + '">Ссылка</button></div></div>' +
      '<div class="result-badges"><span>Оценка <b>' + scoreLabel(work) + '</b></span><span>Награда <b>' + formatTokens(work.reward) + '</b></span></div>' +
      comment +
    '</div>' +
  '</article>';
}


function getParticipantStats() {
  var map = {};

  WORKS.forEach(function(work) {
    var key = String(work.username || "Без автора").trim() || "Без автора";

    if (!map[key]) {
      map[key] = {
        username: key,
        works: 0,
        reward: 0,
        bestScore: 0,
        firstPlaces: 0,
        secondPlaces: 0,
        thirdPlaces: 0,
        zeroPlaces: 0
      };
    }

    map[key].works += 1;
    map[key].reward += getReward(work);
    map[key].bestScore = Math.max(map[key].bestScore, getScore(work));

    if (Number(work.place) === 1) map[key].firstPlaces += 1;
    else if (Number(work.place) === 2) map[key].secondPlaces += 1;
    else if (Number(work.place) === 3) map[key].thirdPlaces += 1;
    else map[key].zeroPlaces += 1;
  });

  return Object.keys(map).map(function(key) {
    return map[key];
  }).sort(function(a, b) {
    if (b.reward !== a.reward) return b.reward - a.reward;
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
    if (b.works !== a.works) return b.works - a.works;
    return a.username.localeCompare(b.username);
  });
}

function renderParticipants() {
  var participants = getParticipantStats();

  if (currentSearch.trim()) {
    var q = currentSearch.trim().toLowerCase();
    participants = participants.filter(function(item) {
      return item.username.toLowerCase().includes(q);
    });
  }

  var totalTokens = participants.reduce(function(sum, item) {
    return sum + item.reward;
  }, 0);

  setAppHtml(
    '<section class="page participants-page">' +
      '<div class="section-title"><a class="back" href="' + urlFor("results") + '" data-route="results">← Назад</a><h2>Победители</h2></div>' +
      '<div class="participants-total"><span>Участников</span><b>' + participants.length + '</b><span>Токенов в списке</span><b>' + formatTokens(totalTokens) + '</b></div>' +
      '<div class="toolbar"><input class="search-input" id="participants-search-input" placeholder="Найти участника..." value="' + escapeHtml(currentSearch) + '"></div>' +
      '<div class="participants-list">' + participants.map(renderParticipantRow).join("") + '</div>' +
    '</section>'
  );

  var input = document.getElementById("participants-search-input");
  if (input) {
    input.oninput = function() {
      currentSearch = input.value;
      renderParticipants();
    };
  }
}

function renderParticipantRow(item, index) {
  return '<div class="participant-row">' +
    '<span class="participant-rank">' + String(index + 1).padStart(2, "0") + '</span>' +
    '<a class="participant-name" href="?page=author&name=' + getAuthorSlug(item.username) + '" data-route="author&name=' + getAuthorSlug(item.username) + '">' + escapeHtml(item.username) + '</a>' +
    '<span class="participant-works">' + item.works + ' работ</span>' +
    '<span class="participant-score">лучшее ' + formatScore(item.bestScore) + '/5</span>' +
    '<span class="participant-places">1м: ' + item.firstPlaces + ' · 2м: ' + item.secondPlaces + ' · 3м: ' + item.thirdPlaces + '</span>' +
    '<b class="participant-reward">' + formatTokens(item.reward) + '</b>' +
  '</div>';
}


function renderByRoute(route) {
  if (route === "results") return renderResultsMenu();
  if (route === "all") return renderAllWorks();
  if (route === "comments") return renderComments();
  if (route === "participants") return renderParticipants();
  if (route.indexOf("author") === 0) return renderAuthor();
  renderHome();
}

function routeTo(route, push) {
  if (isRouting) return;
  isRouting = true;

  if (push) window.history.pushState({}, "", urlFor(route));

  app.classList.remove("route-enter");
  app.classList.add("route-exit");

  setTimeout(function() {
    renderByRoute(route);
    app.classList.remove("route-exit");
    app.classList.add("route-enter");
    setTimeout(function() {
      app.classList.remove("route-enter");
      isRouting = false;
    }, 540);
  }, 260);
}

function setupNavigation() {
  document.addEventListener("click", function(event) {
    var link = event.target.closest("a[data-route]");
    if (!link) return;

    event.preventDefault();

    if (link.getAttribute("data-gallery-start") === "true") {
      currentView = "gallery";
    }

    routeTo(link.getAttribute("data-route"), true);
  });

  window.addEventListener("popstate", function() {
    routeTo(getRouteFromUrl(), false);
  });
}

function findWork(id) {
  return WORKS.find(function(work) {
    return String(work.id) === String(id);
  });
}

function workUrl(id) {
  return window.location.origin + window.location.pathname + "?page=all&work=" + encodeURIComponent(id);
}

function openWork(work) {
  if (!work || !lightbox || !lightboxImg) return;

  lightboxImg.src = work.image;
  lightboxImg.alt = work.username || "";

  if (lightboxCaption) {
    lightboxCaption.innerHTML =
      '<div class="lightbox-title"><b>' + escapeHtml(work.username) + '</b><span> — ' + escapeHtml(work.title || "Работа участника") + '</span></div>' +
      '<div class="lightbox-meta"><b>' + scoreLabel(work) + '</b> · ' + formatTokens(work.reward) + '</div>' +
      (work.comment ? '<blockquote class="lightbox-comment">«' + escapeHtml(work.comment) + '»</blockquote>' : '') +
      '<button class="share-btn" type="button" id="lightbox-share">Скопировать ссылку</button>';
  }

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");

  var share = document.getElementById("lightbox-share");
  if (share) {
    share.onclick = function() {
      copyText(workUrl(work.id), share);
    };
  }
}

function attachImageHandlers() {
  document.querySelectorAll("[data-image]").forEach(function(button) {
    button.onclick = function() {
      openWork(findWork(button.getAttribute("data-work-id")));
    };
  });
}

function attachShareHandlers() {
  document.querySelectorAll("[data-share-id]").forEach(function(button) {
    button.onclick = function() {
      copyText(workUrl(button.getAttribute("data-share-id")), button);
    };
  });
}

function copyText(text, button) {
  function done() {
    if (!button) return;
    var old = button.textContent;
    button.textContent = "Скопировано";
    setTimeout(function() {
      button.textContent = old;
    }, 1200);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(function() {});
  } else {
    var temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    done();
  }
}

function openRandomWork() {
  if (!WORKS.length) return;
  openWork(WORKS[Math.floor(Math.random() * WORKS.length)]);
}

function openWorkFromUrlIfNeeded() {
  var id = new URLSearchParams(window.location.search).get("work");
  if (!id) return;
  var work = findWork(id);
  if (work) setTimeout(function() { openWork(work); }, 250);
}

function closeLightbox() {
  if (!lightbox || !lightboxImg) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
  if (lightboxCaption) lightboxCaption.innerHTML = "";
}

if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
if (lightbox) {
  lightbox.addEventListener("click", function(event) {
    if (event.target === lightbox) closeLightbox();
  });
}

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") closeLightbox();
});

function updateMusicButton(isPlaying, hasError) {
  if (!musicButton) return;

  if (hasError) {
    musicButton.textContent = "!";
    musicButton.classList.remove("is-playing");
    musicButton.classList.add("is-muted");
    musicButton.setAttribute("aria-label", "Музыка не найдена");
    musicButton.setAttribute("title", "Музыка не найдена: проверь audio/theme.mp3");
    return;
  }

  musicButton.textContent = "♪";
  musicButton.setAttribute("aria-label", isPlaying ? "Выключить музыку" : "Включить музыку");
  musicButton.setAttribute("title", isPlaying ? "Выключить музыку" : "Включить музыку");

  if (isPlaying) {
    musicButton.classList.remove("is-muted");
    musicButton.classList.add("is-playing");
  } else {
    musicButton.classList.remove("is-playing");
    musicButton.classList.add("is-muted");
  }
}

function tryStartMusic() {
  updateMusicButton(false);
}

if (musicButton && bgMusic) {
  bgMusic.volume = 0.35;

  bgMusic.addEventListener("error", function() {
    updateMusicButton(false, true);
  });

  musicButton.addEventListener("click", function() {
    if (bgMusic.paused) {
      bgMusic.load();
      bgMusic.play().then(function() {
        updateMusicButton(true);
      }).catch(function() {
        updateMusicButton(false, true);
      });
    } else {
      bgMusic.pause();
      updateMusicButton(false);
    }
  });
}

function showIntro() {
  if (document.getElementById("intro")) return;

  var intro = document.createElement("div");
  intro.id = "intro";
  intro.innerHTML = '<div class="intro-box"><h1>' + escapeHtml(getEventTitle()) + '</h1><p>загрузка итогов</p><div class="loader-line"><span></span></div></div>';

  document.body.appendChild(intro);

  setTimeout(function() {
    intro.classList.add("is-hidden");
    setTimeout(function() {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 650);
  }, 900);
}

setupNavigation();
showIntro();
renderByRoute(getRouteFromUrl());
app.classList.add("route-enter");
tryStartMusic();
