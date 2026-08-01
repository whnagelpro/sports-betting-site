export function buildHero(context) {

    return {

        id: context.profile.id,

        name: context.profile.name,

        firstName: context.profile.firstName,

        lastName: context.profile.lastName,

        team: context.profile.team,

        teamAbbreviation: context.profile.teamAbbreviation,

        position: context.profile.position,

        bats: context.profile.bats ?? "",

        throws: context.profile.throws ?? "",

        height: context.profile.height,

        weight: context.profile.weight

    };

}