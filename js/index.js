(function() {
  /**
   * exemple request 
   * `https://api.themoviedb.org/3/search/movie?api_key=${api_key}&language=${lang}&query=${query}&page=${page}&include_adult=false`
   * @param {string} query - The request to server
   * @param {number} page - Show page number
   */
  function getURL({ query, page = 1 }) {
    return `https://api.themoviedb.org/3/search/movie?api_key=5f6969df62383d057f48f5e2ac804c97&language=en-US&query=${query}&page=${page}&include_adult=false`;
  };

  /**
   * Fetch middleware
   * @param {string} url 
   */
  function* fetchGenerator(url) {
    const request = yield fetch(url);

    const json = yield request.json();

    return json;
  };

  function run(generator, ...args) {
    const iterator = generator(...args);

    function iterate({ done, value }) {
      if (done) {
        return value;
      }

      return value.then(data => iterate(iterator.next(data)))
    }

    return iterate(iterator.next());
  };

  function createTR(arr) {
    let node = '';

    return arr.reduce((prev, current) => {
      const { id, title, original_language, popularity, vote_count, vote_average, release_date } = current;

      node = `
        <tr>
          <th scope="row">${id}</th>
          <td>${title}</td>
          <td>${original_language}</td>
          <td>${popularity}</td>
          <td>${vote_count}</td>
          <td>${vote_average}</td>
          <td>${release_date}</td>
        </tr>
      `;
      
      prev.push({ node });

      return prev;
    }, []);
  };

  function createPagination(total, btnPage) {
    const current =  btnPage && btnPage !== void 0 ? btnPage : 1;
    const result = [];
    let node = '';

    function bntPrev() {
      node = `
        <li>
          <a href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
      `;
      
      result.push({ node });
    };

    function btnNext() {
      node = `
        <li>
          <a href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      `;

      result.push({ node });
    };

    function btnNumber() {
      let number;

      for(number = 1; number <= total; number++) {
        
        if(number === current) {
          node = `
            <li class="active"><a href="#">${number}</a></li>
          `;
        } else {
          node = `
            <li><a href="#">${number}</a></li>
          `;
        }
        result.push({ node });

      };
    }

    bntPrev();

    btnNumber();

    btnNext();

    return result.reverse();
  };

  /**
   * Function for get movies
   * @param {string} query - Search word
   * @param {number} page - Sowed page number
   */
  function getMovies(query, page) {
    const url = getURL({ query, page });
    
    return run(
      function* (query) {
        const request = yield* fetchGenerator(query);

        return request;
      },
      url
    ).catch(console.error);
  };

  function getNodeRowsByIndex(arrNodeRows, index) {
    return Array.prototype.reduce.call(arrNodeRows, (prev, current) => {
      const node = current;
      const value = current.cells[index].innerText;

      prev.push({ node, value });

      return prev;
    }, []);
  };

  function appendChildHTML(parentNode, nodes) {
    parentNode.innerHTML = '';
    nodes.forEach(e => parentNode.insertAdjacentHTML('afterbegin', e.node));
  };

  function appendChildNodes(parentNode, nodes) {
    nodes.forEach(e => parentNode.insertAdjacentElement('afterbegin', e.node));
  };

  function compareString(a, b) {
    return a.value > b.value ? 1 : -1;
  };

  function compareNumber(a, b) {
    return a.value - b.value;
  };

  function compare(source, byIncrease) { // [ { node: tr, value: 1, }, { node: tr, value: 1, }, ]
    const tempMap = {
      string: [],
      object: [],
    };

    source.forEach((e) => { // tr, index
      if(isFinite(e.value)) {
        tempMap.object.push(e);
      } else {
        tempMap.string.push(e);
      };
    });

    tempMap.string.sort(compareString);
    tempMap.object.sort(compareNumber);

    const newSource = tempMap.string.concat(tempMap.object);

    if (!byIncrease) {
      return newSource;
    } else {
      return newSource.reverse();
    } 
  };

  ///------------



  /**
   * Event click.
   */
  const input_search = document.getElementById('input-search');
  const button_search = document.getElementById('button-search');
  const table = document.querySelector('table');
  const tbody = table.tBodies[0] || table.appendChild(document.createElement('tbody'));
  const thead = table.tHead;
  const allTH = thead.getElementsByTagName('TH');
  const pagination = document.getElementById('pagination');
  const sortUp = {
    isUp: true,
    rowIndex: 1,
    sortIcon: 'sort-up',
  };
  let numberPage = 1;
  let movies = {};

  function viewGetResult(request) {
    if (request.errors) {
      return;
    };

    Object.assign(movies, request);

    makeResult();
  };

  function makeResult() {
    const { results, total_pages } = movies;

    appendChildHTML(tbody, createTR(results));

    const arrNodeRows = getNodeRowsByIndex(tbody.rows, sortUp.rowIndex);

    const nodes = compare(arrNodeRows, !sortUp.isUp);

    appendChildNodes(tbody, nodes);

    appendChildHTML(pagination, createPagination(total_pages, numberPage));
  };

  function clearSortIcon() {
    Array.prototype.forEach.call(allTH, (th) => {
      th.classList.remove('sort-up');
      th.classList.remove('sort-down');
    });
  };


  document.addEventListener('click', (e) => {
    const target = e.target;
    const btnSearch = target.closest('#button-search');
    const TH = target.closest('TH');

    btnPage = target.closest('#pagination')
      && !target.closest('a').getAttribute('aria-label')
      && isFinite(target.closest('a').innerText)
      ? numberPage =  Number(target.closest('a').innerText)
      : false;

    const prevPage = target.closest('#pagination')
      && target.closest('a').getAttribute('aria-label') === 'Previous'
      ? numberPage = numberPage -1
      : false;

    const nextPage = target.closest('#pagination')
      && target.closest('a').getAttribute('aria-label') === 'Next'
      ? numberPage = numberPage + 1
      : false;


    /** Search info   */
    if (btnSearch || btnPage || prevPage || nextPage) {
      const query = input_search.value;

      getMovies(query, numberPage).then(viewGetResult);

      e.preventDefault();
      
      return;
    };


    /** Sort content   */
    if (TH && movies.results) {
      const arrRows = tbody.rows;
      const index = TH.cellIndex;

      if (sortUp.rowIndex !== index) {
        sortUp.isUp = true;
        sortUp.rowIndex = index;

        clearSortIcon();
        
        sortUp.sortIcon = 'sort-up';
      };

      sortUp.isUp = !sortUp.isUp;

      /** [ { node: tr, value: tr.cells[index].innerText }, ] */
      const arrNodeRows = getNodeRowsByIndex(arrRows, index);

      const nodes = compare(arrNodeRows, !sortUp.isUp);

      appendChildNodes(tbody, nodes);

      clearSortIcon();

      TH.classList.add(sortUp.sortIcon);
      !sortUp.isUp ? sortUp.sortIcon = 'sort-down' : sortUp.sortIcon = 'sort-up';

      e.preventDefault();

      return;
    };

  });

})();
