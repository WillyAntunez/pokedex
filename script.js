'use strict';

const $searchInput = document.getElementById('search-input');

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

const fetchData = async (url) => {
    const res = await fetch(url);
    const data = await res.json();
    return data;
};

const getPokemon = async (url) => {
    const pokemon = await fetchData(url);
    return {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default,
        url: url,
    };
};

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

/* TODO: crear objeto pokemonSelected para el pokemon que actualmente se muestra en la pokedex */

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

                //FIXME: algunos pokemons no tienen imagen, hay que validar si no tienen imagen y usar una imagen en caso de que no la tengan
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
                console.log('no se encontraron pokemons');
            } else {
                console.log('No hay mas pokemons para cargar');
            }
        }
    } catch (error) {
        console.log(error);
        cardsError = error;
        //TODO: crear aquí manejo del error al cargar las cards
    } finally {
        loadingCards = false;
        $cardsLoader.classList.add('hidden');
    }
};

const clearPokemonsLoaded = () => {
    const $pokemonsContainer = document.getElementById('pokemons-container');

    $pokemonsContainer.innerHTML = '';

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

/* TODO: Funcion (filterPokemons) que debe filtrar segun parametro de busqueda, filtros y ordenar los pokemons resultantes */
const filterPokemons = async () => {
    const query = $searchInput.value;

    pokemonsFiltered.pokemons = allPokemons.pokemons.filter((pokemon) => {
        if (pokemon.name.toLowerCase().startsWith(query.toLowerCase())) {
            return true;
        }
    });

    await showMorePokemons(pokemonsFiltered, 20);
};

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
    /* Inifinite scroll */
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
        /* FIXME: agregar logica para que la fuente de los pokemon varie entre all y filtered segun sea el caso */
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
        clearPokemonsLoaded();
        filterPokemons();
    }
});
