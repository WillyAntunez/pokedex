'use strict';

const $searchInput = document.getElementById('search-input');
const $cardsMessage = document.getElementById('cards-message');
const $orderBySelect = document.getElementById('order-by');

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

/* TODO: crear objeto pokemonSelected para el pokemon que actualmente se muestra en la pokedex */

let loadingCards = false;
let cardsError = false;

const fetchData = async (url) => {
    const res = await fetch(url);
    const data = await res.json();
    return data;
};

/* Obtiene datos de un pokemon en específico, recibe una url y retorna un objeto con los datos simplificados del pokemon */
const getPokemon = async (url) => {
    const pokemon = await fetchData(url);
    return {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default,
        url: url,
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
                    pokemon.sprite || `${pageURL}/assets/img/no-image.jpg`;

                $newPokemonCards += `
                    <div class="cards__card">
                        <img src="${sprite}" alt="${pokemon.name}" class="cards__sprite" loading="lazy">
                        <h3 class="cards__text cards__text--name">${pokemon.name}</h3>
                        <span class="cards__text cards__text--id">${pokemon.id}</span>
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

    const query = $searchInput.value;

    let newPokemons = [...allPokemons.pokemons];

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
};

/* Verifica si existen filtros activos */
const areFiltersActive = () => {
    if ($searchInput.value.length >= 1 || $orderBySelect.value === 'name') {
        return true;
    }
    return false;
};

/* Función anonima que se autoejecuta solo una vez al cargar la página para mostrar los primeros pokemons */
(async () => {
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
        if (
            !pokemonsFiltered.pokemons ||
            pokemonsFiltered.pokemons.length === 0
        ) {
            await showMorePokemons(allPokemons, 20);
        } else {
            await showMorePokemons(pokemonsFiltered, 20);
        }
    }

    // TODO: Agregar un boton para que se pueda volver arriba rapidamente
});

$searchInput.addEventListener('keyup', async (e) => {
    if (e.target.value === ' ') {
        e.target.value = '';
    } else if (e.target.value === '') {
        clearPokemonsLoaded();
        await showMorePokemons(allPokemons, 20);
    } else {
        filterPokemons();
    }
});

$orderBySelect.addEventListener('change', async (e) => {
    /* si quiere ordenar por nombre o si quiere ordenar por id(default) pero quedan filtros activos */
    if (
        e.target.value === 'name' ||
        (e.target.value === 'id' && areFiltersActive())
    ) {
        filterPokemons();
    } else {
        clearPokemonsLoaded();
        await showMorePokemons(allPokemons, 20);
    }
});
