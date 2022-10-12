'use strict';

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
    loadingCards = true;
    //TODO: Agregar aquí funcionalidad para mostrar loader

    try {
        const $pokemonsContainer =
            document.getElementById('pokemons-container');

        let startIndex = pokemonsLoaded.nextIndex;
        let endIndex = pokemonsLoaded.nextIndex + quantity - 1;

        let newPokemons = await loadPokemons(
            pokemonsArray.pokemons,
            startIndex,
            endIndex
        );

        let $newPokemonCards = '';

        pokemonsLoaded.pokemons = [...pokemonsLoaded.pokemons, ...newPokemons];
        pokemonsLoaded.nextIndex = endIndex + 1;

        let arrayLastIndex = pokemonsArray.length - 1;
        if (arrayLastIndex < endIndex) endIndex = arrayLastIndex;

        for (let i = startIndex; i <= endIndex; i++) {
            let pokemon = pokemonsLoaded.pokemons[i];

            $newPokemonCards += `
            <div class="cards__card">
                <img src="${pokemon.sprite}" alt="${pokemon.name}" class="cards__sprite" loading="lazy">
                <h3 class="cards__text cards__text--name">${pokemon.name}</h3>
                <span class="cards__text cards__text--id">${pokemon.id}</span>
            </div>
        `;
        }

        $pokemonsContainer.innerHTML += $newPokemonCards;
    } catch (error) {
        console.log(error);
        cardsError = error;
        //TODO: crear aquí manejo del error al cargar las cards
    } finally {
        loadingCards = false;
        //TODO: Crear aquí funcion para quitar el loader
    }
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
    if (scrollTop + clientHeight > scrollHeight - 30 && !loadingCards) {
        await showMorePokemons(allPokemons, 20);
        console.log('carga más');
    }

    // TODO: Agregar un boton para que se pueda volver arriba rapidamente
});
