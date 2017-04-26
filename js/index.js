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

function tBody(node, props) {
  const { id, title = 'Killer Elite', original_language = 'en', popularity = 3.108736, vote_count = 576, vote_average = 6, release_date = '2011-09-23' } = props;
  
  const template = `
    <th scope="row">${id}</th>
    <td>${title}</td>
    <td>${original_language}</td>
    <td>${popularity}</td>
    <td>${vote_count}</td>
    <td>${vote_average}</td>
    <td>${release_date}</td>
  `;

  const tr = document.createElement('tr');

  tr.innerHTML = template;

  node.appendChild(tr);
};

function pagination(total, btnPage) {
  const current =  btnPage && btnPage !== void 0 ? btnPage : 1;
  const node = document.createElement('ul');

  node.classList.add('pagination');

  function prev() {
    const li = document.createElement('li');

    li.innerHTML = `
      <a href="#" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </a>
    `;

    return li;
  };

  function next() {
    const li = document.createElement('li');

    li.innerHTML = `
        <a href="#" aria-label="Next">
          <span aria-hidden="true">&raquo;</span>
        </a>
    `;

    return li;
  };


  node.appendChild(prev());

  let number;

  for(number = 1; number <= total; number++) {
    const li = document.createElement('li');

    if(number === current) {
      li.classList.add('active');
    }

    li.innerHTML = `<a href="#">${number}</a>`;
    node.appendChild(li);
  };

  node.appendChild(next());

  return node;
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

function createTBody(tag, nodes) {
  tag.innerHTML = '';
  nodes.forEach(e => tag.appendChild(e.node));

  return tBody;
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

  if (!!byIncrease) {
    return tempMap.string.concat(tempMap.object);
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
const paginator = document.getElementById('pagination');
const sortUp = {
  isUp: true,
  index: void 0,
};
let numberPage;
let movies = {};


document.addEventListener('click', (e) => {
  const target = e.target;
  const btnSearch = target.closest('#button-search');
  const column = target.closest('TH');

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

    getMovies(query, numberPage).then(request => {
      Object.assign(movies, request);

      const tbody = document.createElement('tbody');

      const { results, total_pages } = movies;

      for(result of results) {
        tBody(tbody, result);
      };

      /** Append tBodies into DOM */
      table.tBodies[0] && table.removeChild(table.tBodies[0]);
      table.appendChild(tbody);

      /** Append nav pages into DOM */
      paginator.innerHTML = '';
      paginator.appendChild(pagination(total_pages, numberPage));
    });

    e.preventDefault();
    
    return;
  };


  /** Sort content   */
  if (column) {
    const table = target.closest('TABLE');
    const tBody = table.tBodies[0];
    const arrRows = tBody.rows;
    const index = column.cellIndex;

    if (sortUp.index !== index) {
      sortUp.isUp = true;
      sortUp.index = index;
    };

    /** [ { node: tr, value: tr.cells[index].innerText }, ] */
    const arrNodeRows = Array.prototype.reduce.call(arrRows, (prev, current) => {
      const node = current;
      const value = current.cells[index].innerText;

      prev.push({ node, value });

      return prev;
    }, []);

    const nodes = compare(arrNodeRows, sortUp.isUp);

    createTBody(tBody, nodes);

    sortUp.isUp = !sortUp.isUp;

    e.preventDefault();

    return;
  };

});
