'use strict';

const $cardsMessage = document.getElementById('cards-message');

/* Filters DOM elements */
const $searchInput = document.getElementById('search-input');
const $eggGroupSelect = document.getElementById('egg-group-select');
const $colorsSelect = document.getElementById('colors-select');
const $shapeSelect = document.getElementById('shape-select');
const $habitatSelect = document.getElementById('habitat-select');
const $generationSelect = document.getElementById('generation-select');
const $typeSelect = document.getElementById('type-select');
const $orderBySelect = document.getElementById('order-by');
const $filtersForm = document.querySelector('.filters__form');

/* Pokemon selected DOM elements */
const $selectedPokemonImg = document.querySelector(
    '.pokemon .pokemon__screen .pokemon__sprite'
);
const $selectedPokemonId = document.querySelector(
    '.pokemon .pokemon__screen .pokemon__text'
);
const $selectedPokemonName = document.querySelector(
    '.pokemon .pokemon__text--name'
);
const $selectedPokemonType = document.querySelector(
    '.pokemon .pokemon__text--type'
);
const $selectedPokemonHeight = document.querySelector(
    '.pokemon .pokemon__text--height'
);
const $selectedPokemonWeight = document.querySelector(
    '.pokemon .pokemon__text--weight'
);
const $selectedPokemonEggGroup = document.querySelector(
    '.pokemon .pokemon__text--egg-group'
);
const $selectedPokemonAbilities = document.querySelector(
    '.pokemon .pokemon__ul--habilities'
);
const $selectedPokemonCatchRate = document.querySelector(
    '.pokemon .pokemon__text--catch-rate'
);
const $selectedPokemonShape = document.querySelector(
    '.pokemon .pokemon__text--shape'
);
const $selectedPokemonAtk = document.querySelector(
    '.pokemon .pokemon__stat--atk'
);
const $selectedPokemonHp = document.querySelector(
    '.pokemon .pokemon__stat--hp'
);
const $selectedPokemonDef = document.querySelector(
    '.pokemon .pokemon__stat--def'
);
const $selectedPokemonSpd = document.querySelector(
    '.pokemon .pokemon__stat--spd'
);

const pageURL = '.';

const API = 'https://pokeapi.co/api/v2';

let allPokemons = {
    count: undefined,
    pokemons: [],
};

let pokemonsFiltered = {
    count: undefined,
    pokemons: [],
};

let pokemonsLoaded = {
    nextIndex: 0,
    pokemons: [],
};

let loadingCards = false;
let cardsError = false;
let areFiltersHidden = false;

const fetchData = async (url) => {
    const res = await fetch(url);
    const data = await res.json();
    return data;
};

/* Obtiene datos de un pokemon en específico, recibe una url y retorna un objeto con los datos simplificados del pokemon */
const getPokemon = async (url) => {
    const pokemon = await fetchData(url);

    const abilities = pokemon.abilities.map((ability) => ability.ability.name);
    const attack = pokemon.stats.find(
        (stat) => stat.stat.name === 'attack'
    ).base_stat;
    const hp = pokemon.stats.find((stat) => stat.stat.name === 'hp').base_stat;
    const defense = pokemon.stats.find(
        (stat) => stat.stat.name === 'defense'
    ).base_stat;
    const speed = pokemon.stats.find(
        (stat) => stat.stat.name === 'speed'
    ).base_stat;

    return {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default,
        url: url,
        types: pokemon.types.map((type) => type.type.name),
        height: pokemon.height * 0.1,
        weight: pokemon.weight * 0.220462,
        speciesUrl: pokemon.species.url,
        abilities,
        attack,
        hp,
        defense,
        speed,
    };
};

/* Obtiene la lista inicial de nombres y urls de todos los pokemons sin filtros desde la pokeapi */
const getAllPokemons = async (
    api = 'https://pokeapi.co/api/v2',
    limit = 100000,
    offset = 0
) => {
    const data = await fetchData(
        `${api}/pokemon?limit=${limit}&offset=${offset}`
    );

    return data;
};

/* Carga las categorias de egg-group para los filtros y el objeto eggGroups */
const getSelectFilter = async ($select, url) => {
    const data = await fetchData(url);

    data.results.forEach((group) => {
        const $option = document.createElement('option');
        $option.setAttribute('value', group.name);
        $option.innerText = group.name;
        $option.dataset.url = group.url;

        $select.append($option);
    });
};

/* Carga los datos especificos de cada pokemon de un array de pokemons y los retorna en un nuevo array  */
const loadPokemons = async (pokemonsArray, startIndex, endIndex) => {
    let loadedPokemons = [];
    let arrayLastIndex = pokemonsArray.length - 1;

    if (arrayLastIndex < endIndex) endIndex = arrayLastIndex;

    for (let i = startIndex; i <= endIndex; i++) {
        const url = pokemonsArray[i].url;
        const newPokemon = await getPokemon(url);
        loadedPokemons.push(newPokemon);
    }

    return loadedPokemons;
};

/* Muestra pokemons (o más pokemons) en pantalla */
const showMorePokemons = async (pokemonsArray, quantity) => {
    const $cardsLoader = document.getElementById('cards-loader');

    try {
        const $pokemonsContainer =
            document.getElementById('pokemons-container');

        loadingCards = true;
        $cardsLoader.classList.remove('hidden');

        let startIndex = pokemonsLoaded.nextIndex;
        let endIndex = pokemonsLoaded.nextIndex + quantity - 1;

        let newPokemons = await loadPokemons(
            pokemonsArray.pokemons,
            startIndex,
            endIndex
        );

        if (newPokemons.length > 0) {
            let $newPokemonCards = '';

            pokemonsLoaded.pokemons = [
                ...pokemonsLoaded.pokemons,
                ...newPokemons,
            ];
            pokemonsLoaded.nextIndex = endIndex + 1;

            let arrayLastIndex = pokemonsArray.pokemons.length - 1;
            if (arrayLastIndex < endIndex) endIndex = arrayLastIndex;

            for (let i = startIndex; i <= endIndex; i++) {
                let pokemon = pokemonsLoaded.pokemons[i];

                let sprite =
                    pokemon.sprite || `${pageURL}/assets/img/no-image.png`;

                $newPokemonCards += `
                    <div class="cards__card">
                        <img src="${sprite}" alt="${pokemon.name}" class="cards__sprite" loading="lazy" data-pokemon-id="${pokemon.id}">
                        <h3 class="cards__text cards__text--name" data-pokemon-id="${pokemon.id}">${pokemon.name}</h3>
                        <span class="cards__text cards__text--id"  data-pokemon-id="${pokemon.id}">${pokemon.id}</span>
                    </div>
                `;
            }

            $pokemonsContainer.innerHTML += $newPokemonCards;
        } else {
            if (pokemonsLoaded.pokemons.length === 0) {
                /* Si no se encuentran pokemons */
                $cardsMessage.innerHTML = `
                    <img src="${pageURL}/assets/img/sad-pikachu.jpg" alt="sad pikachu">
                    <div class="cards__text">We didn't find any pokemon :'(</div>
                `;

                $cardsMessage.classList.remove('hidden');
            } else {
                /* Si ya se cargaron todos los pokemons disponibles */
                $cardsMessage.innerHTML = `
                    <div class="cards__text">--- END ---</div>
                `;

                $cardsMessage.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.log(error);
        cardsError = error;

        $cardsMessage.innerHTML = `
                    <img src="${pageURL}/assets/img/sad-pikachu.jpg" alt="sad pikachu">
                    <div class="cards__text">An error occurred :'(</div>
                    <div class="cards__text">${error}</div>
                `;

        $cardsMessage.classList.remove('hidden');
    } finally {
        loadingCards = false;
        $cardsLoader.classList.add('hidden');
    }
};

/* Limpia los datos de pokemons cargados y las cards del DOM */
const clearPokemonsLoaded = () => {
    const $pokemonsContainer = document.getElementById('pokemons-container');

    $pokemonsContainer.innerHTML = '';
    $cardsMessage.classList.add('hidden');

    pokemonsLoaded = {
        nextIndex: 0,
        pokemons: [],
    };

    pokemonsFiltered = {
        count: undefined,
        pokemons: [],
    };

    loadingCards = false;
    cardsError = false;
};

/* Obtiene el array de objetos pokemons filtrados y muestra la lista inicial */
const filterPokemons = async () => {
    clearPokemonsLoaded();
    loadingCards = true;

    const query = $searchInput.value;

    let newPokemons = [...allPokemons.pokemons];

    const filterByUrl = async ($select) => {
        const url = $select[$select.selectedIndex].dataset.url;

        let pokemons = await fetchData(url);
        pokemons = pokemons.pokemon_species;

        newPokemons = newPokemons.filter((pokemon) => {
            const pokemonIndex = pokemons.findIndex(
                (newPokemon) => pokemon.name === newPokemon.name
            );
            if (pokemonIndex > -1) {
                return true;
            }
        });
    };

    /* Egg group filter */
    if ($eggGroupSelect.value !== 'default') {
        await filterByUrl($eggGroupSelect);
    }

    /* color filter */
    if ($colorsSelect.value !== 'default') {
        await filterByUrl($colorsSelect);
    }

    /* shape filter */
    if ($shapeSelect.value !== 'default') {
        await filterByUrl($shapeSelect);
    }

    /* habitat filter */
    if ($habitatSelect.value !== 'default') {
        await filterByUrl($habitatSelect);
    }

    /* generation filter */
    if ($generationSelect.value !== 'default') {
        await filterByUrl($generationSelect);
    }

    /* Type filter */
    if ($typeSelect.value !== 'default') {
        const typeUrl = $typeSelect[$typeSelect.selectedIndex].dataset.url;
        const result = await fetchData(typeUrl);

        const typePokemons = result.pokemon.map((pokemon) => {
            return {
                name: pokemon.pokemon.name,
                url: pokemon.pokemon.url,
            };
        });

        newPokemons = newPokemons.filter((pokemon) => {
            const pokemonIndex = typePokemons.findIndex(
                (newPokemon) => pokemon.name === newPokemon.name
            );
            if (pokemonIndex > -1) {
                return true;
            }
        });
    }

    /* Search filter */
    if ($searchInput.value.length >= 1) {
        newPokemons = newPokemons.filter((pokemon) => {
            if (pokemon.name.toLowerCase().startsWith(query.toLowerCase())) {
                return true;
            }
        });
    }

    /* order by */
    if ($orderBySelect.value === 'name') {
        newPokemons = newPokemons.sort((a, b) => {
            if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1;
            }
            if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1;
            }
            return 0;
        });
    }

    pokemonsFiltered.pokemons = newPokemons;

    await showMorePokemons(pokemonsFiltered, 20);
    loadingCards = false;
};

/* Verifica si existen filtros activos */
const areFiltersActive = () => {
    if (
        $searchInput.value.length >= 1 ||
        $orderBySelect.value === 'name' ||
        $eggGroupSelect.value !== 'default' ||
        $colorsSelect.value !== 'default' ||
        $shapeSelect.value !== 'default' ||
        $habitatSelect.value !== 'default' ||
        $generationSelect.value !== 'default' ||
        $typeSelect.value !== 'default'
    ) {
        return true;
    }
    return false;
};

/* Resetea todos los filtros */
const clearFilters = async () => {
    $searchInput.value = '';
    $orderBySelect.value = 'id';
    $eggGroupSelect.value = 'default';
    $colorsSelect.value = 'default';
    $shapeSelect.value = 'default';
    $habitatSelect.value = 'default';
    $generationSelect.value = 'default';
    $typeSelect.value = 'default';

    clearPokemonsLoaded();
    await showMorePokemons(allPokemons, 20);
};

const onChangeFilter = async (e) => {
    if (areFiltersActive()) {
        filterPokemons();
    } else {
        clearPokemonsLoaded();
        await showMorePokemons(allPokemons, 20);
    }
};

/* Función anonima que se autoejecuta solo una vez al cargar la página para mostrar los primeros pokemons */
(async () => {
    await getSelectFilter($eggGroupSelect, `${API}/egg-group`);
    await getSelectFilter($colorsSelect, `${API}/pokemon-color`);
    await getSelectFilter($shapeSelect, `${API}/pokemon-shape`);
    await getSelectFilter($habitatSelect, `${API}/pokemon-habitat`);
    await getSelectFilter($generationSelect, `${API}/generation`);
    await getSelectFilter($typeSelect, `${API}/type`);

    if (localStorage.getItem('ALL_POKEMONS')) {
        allPokemons = await JSON.parse(localStorage.getItem('ALL_POKEMONS'));
    } else {
        const { count, results } = await getAllPokemons();
        allPokemons.count = count;
        allPokemons.pokemons = results;
        localStorage.setItem('ALL_POKEMONS', JSON.stringify(allPokemons));
    }

    await showMorePokemons(allPokemons, 20);
})();

document.addEventListener('scroll', async (e) => {
    /* Infinite scroll */
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (
        scrollTop + clientHeight > scrollHeight - 30 &&
        !loadingCards &&
        !cardsError
    ) {
        if (areFiltersActive()) {
            await showMorePokemons(pokemonsFiltered, 20);
        } else {
            await showMorePokemons(allPokemons, 20);
        }
    }
});

document.addEventListener('click', async (e) => {
    /* Clear filters button click event */
    if (
        e.target.matches('#clear-filters') ||
        e.target.matches('#clear-filters *')
    ) {
        clearFilters();
    }

    /* Show and hide filters button click event */
    if (
        e.target.matches('.filters__button--showhide') ||
        e.target.matches('.filters__button--showhide *')
    ) {
        if (!areFiltersHidden) {
            document.querySelector(
                '.filters__button .filters__text'
            ).innerText = 'Show filters';
            document
                .querySelector('.filters__button--showhide')
                .classList.add('hidded');
            areFiltersHidden = true;
        } else {
            document.querySelector(
                '.filters__button .filters__text'
            ).innerText = 'Hide filters';
            document
                .querySelector('.filters__button--showhide')
                .classList.remove('hidded');
            areFiltersHidden = false;
        }

        $filtersForm.classList.toggle('hidden');
    }

    /* Pokemon card click event */
    if (
        e.target.matches('.cards__card') ||
        e.target.matches('.cards__card *')
    ) {
        const pokemonId = e.target.getAttribute('data-pokemon-id');
        const pokemonInfo = pokemonsLoaded.pokemons.find(
            (el) => el.id == pokemonId
        );

        const pokemonSpecies = await fetchData(pokemonInfo.speciesUrl);

        const sprite =
            pokemonInfo.sprite || `${pageURL}/assets/img/no-image.png`;
        const egg_groups = pokemonSpecies.egg_groups.map((group) => group.name);
        const $abilities = pokemonInfo.abilities
            .map(
                (ability) =>
                    `<li class="pokemon__text pokemon__text--red">*${ability}</li>`
            )
            .join('');
        const captureRate = pokemonSpecies.capture_rate;
        const shape = pokemonSpecies.shape.name;

        $selectedPokemonImg.src = sprite;
        $selectedPokemonId.innerText = pokemonInfo.id;
        $selectedPokemonName.innerText = pokemonInfo.name;
        if (pokemonInfo.types.length === 1) {
            $selectedPokemonType.innerText = pokemonInfo.types;
        } else {
            $selectedPokemonType.innerText = pokemonInfo.types.join(', ');
        }
        $selectedPokemonHeight.innerText = `${pokemonInfo.height.toFixed(2)}m`;
        $selectedPokemonWeight.innerText = `${pokemonInfo.weight.toFixed(2)}kg`;
        $selectedPokemonEggGroup.innerText = `${egg_groups.join(', ')}`;
        $selectedPokemonAbilities.innerHTML = $abilities;
        $selectedPokemonCatchRate.innerText = captureRate;
        $selectedPokemonShape.innerText = shape;

        $selectedPokemonAtk.innerHTML = `<div class="pokemon__text">
                            <strong>ATK:</strong>
                            <span class="pokemon__text--red">${
                                pokemonInfo.attack
                            } / 300</span>
                        </div>
                        <div class="pokemon__bar">
                            <div style="width: ${
                                (pokemonInfo.attack * 100) / 300
                            }%"></div>
                        </div>`;
        $selectedPokemonHp.innerHTML = `<div class="pokemon__text">
                            <strong>HP:</strong>
                            <span class="pokemon__text--red">${
                                pokemonInfo.hp
                            } / 300</span>
                        </div>
                        <div class="pokemon__bar">
                            <div style="width: ${
                                (pokemonInfo.hp * 100) / 300
                            }%"></div>
                        </div>`;
        $selectedPokemonDef.innerHTML = `<div class="pokemon__text">
                            <strong>DEF:</strong>
                            <span class="pokemon__text--red">${
                                pokemonInfo.defense
                            } / 300</span>
                        </div>
                        <div class="pokemon__bar">
                            <div style="width: ${
                                (pokemonInfo.defense * 100) / 300
                            }%"></div>
                        </div>`;
        $selectedPokemonSpd.innerHTML = `<div class="pokemon__text">
                            <strong>SPD:</strong>
                            <span class="pokemon__text--red">${
                                pokemonInfo.speed
                            } / 300</span>
                        </div>
                        <div class="pokemon__bar">
                            <div style="width: ${
                                (pokemonInfo.speed * 100) / 300
                            }%"></div>
                        </div>`;

        if (screen.width > 922) {
            window.scroll({ top: 0, behavior: 'smooth' });
        } else {
            document.querySelector('.pokemon').classList.add('show');
        }
    }

    /* Close mobile view */
    if (
        e.target.matches('.pokemon .pokemon__back') ||
        e.target.matches('.pokemon .pokemon__back *')
    ) {
        document.querySelector('.pokemon').classList.remove('show');
    }
});

$searchInput.addEventListener('keyup', onChangeFilter);
$orderBySelect.addEventListener('change', onChangeFilter);
$eggGroupSelect.addEventListener('change', onChangeFilter);
$colorsSelect.addEventListener('change', onChangeFilter);
$shapeSelect.addEventListener('change', onChangeFilter);
$habitatSelect.addEventListener('change', onChangeFilter);
$generationSelect.addEventListener('change', onChangeFilter);
$typeSelect.addEventListener('change', onChangeFilter);
