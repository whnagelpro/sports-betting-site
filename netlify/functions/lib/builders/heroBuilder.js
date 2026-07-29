export function buildHero(context) {

    return {

        id: context.profile.Id,

        name: context.profile["Full Name"],

        firstName: context.profile["First Name"],

        lastName: context.profile["Last Name"],

        team: context.profile["Team Name"],

        teamAbbreviation: context.profile["Team Abbreviation"],

        position: context.profile.Position,

        bats: context.profile.Bats,

        throws: context.profile.Throws,

        height: context.profile.Height,

        weight: context.profile.Weight

    };

}