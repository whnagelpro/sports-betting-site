export function calculateGameContext({

    paceModifier = 1.00,

    defenseModifier = 1.00,

    homeModifier = 1.00,

    restModifier = 1.00

}) {

    const contextMultiplier =

        paceModifier *

        defenseModifier *

        homeModifier *

        restModifier;

    return {

        contextMultiplier:

            Number(contextMultiplier.toFixed(3)),

        breakdown: {

            paceModifier,

            defenseModifier,

            homeModifier,

            restModifier

        }

    };

}