// Menu de ayuda
const helpMenu = `
    ----------------
    GitHub User Activity CLI
    ----------------

    Use: node <file> <command>

    Commands:
        - help
        - username
`

// URL de la API de GitHub para obtener la actividad del usuario
const GITHUB_API_URL = 'https://api.github.com/users/<username>/events'

function pushEventFormatter(events) {
    const dataMap = events.map((ev) => ({
        type: ev.type,
        actor: ev.actor.login,
        repoName: ev.repo.name,
        actor: ev.actor.login,
    }))

    return dataMap.reduce((acc, ev) => {
        const repoName = ev.repoName
        acc[repoName] = {
            type: ev.type,
            actor: ev.actor,
            count: (acc[repoName]?.count || 0) + 1,
        }
        return acc
    }, {})
}

function watchEventFormatter(events) {
    return events.map((ev) => ({
        type: ev.type,
        repoName: ev.repo.name,
        action: ev.payload.action,
        isPublicRepo: ev.public,
        org: ev.org.login,
    }))
}

function createEventFormatter(events) {
    const data = events.map((ev) => ({
        type: ev.type,
        actor: ev.actor.login,
        repoName: ev.repo.name,
        branch: ev.payload.master_branch,
        description: ev.payload.description,
        isPublicRepo: ev.public,
    }))

    const uniqueRepos = data.reduce((acc, ev) => {
        const repoKey = ev.repoName
        if (!acc[repoKey]) {
            acc[repoKey] = ev
        }
        return acc
    }, {})

    return Object.values(uniqueRepos)
}

function getEventsByType(dataEvents) {
    const eventTypes = dataEvents.map((event) => event.type)

    const setEventTypes = new Set(eventTypes)

    const uniqueEventTypes = [...setEventTypes]

    const objectEventTypes = {}

    for (let eventType of uniqueEventTypes) {
        objectEventTypes[eventType] = dataEvents.filter(
            (event) => event.type === eventType,
        )
    }

    return objectEventTypes
}

function getEventsByTypeFormatted(eventByType) {
    const eventByTypeFormatted = {}

    for (let event in eventByType) {
        let data = eventByType[event]
        eventByTypeFormatted[event] = eventFormatter[event](data)
    }

    return eventByTypeFormatted
}

// Función para obtener la actividad del usuario
async function getUserActivity(username) {
    const URL = GITHUB_API_URL.replace('<username>', username)

    return await fetch(URL, { method: 'GET' })
}

function pushEvent(eventObject) {
    for (let repoName in eventObject) {
        const event = eventObject[repoName]

        console.log(
            `- ${event.type}: ${event.count} commits to ${repoName} by ${event.actor}`,
        )
    }
}

function watchEvent(events) {
    for (let event of events) {
        console.log(
            `- ${event.type}: ${event.action} ${
                event.isPublicRepo ? 'public' : 'private'
            } ${event.repoName} by ${event.org}`,
        )
    }
}

function createEvent(events) {
    for (let event of events) {
        console.log(
            `- ${event.type}: ${
                event.isPublicRepo ? 'Public' : 'Private'
            } repo ${event.repoName} created in branch ${event.branch} by ${
                event.actor
            }${
                event.description
                    ? ` with description: ${event.description}`
                    : ''
            }`,
        )
    }
}

const eventFormatter = {
    PushEvent: pushEventFormatter,
    WatchEvent: watchEventFormatter,
    CreateEvent: createEventFormatter,
}

// Objeto que contiene las funciones para cada tipo de evento
const events = {
    PushEvent: pushEvent,
    WatchEvent: watchEvent,
    CreateEvent: createEvent,
}

// Función principal
async function main() {
    const args = process.argv.slice(2)

    if (args.length === 0) {
        console.log('No command provided. Showing help menu.\n', helpMenu)
        process.exit(1)
    }

    if (args.includes('help')) {
        console.log(helpMenu)
        process.exit(0)
    }

    const [username] = args

    let dataEvents = []

    try {
        const response = await getUserActivity(username)

        if (response.status !== 200) {
            console.error(
                'User not found by username. Please check the username and try again.',
            )
            process.exit(1)
        }

        const data = await response.json()

        dataEvents = [...data]
    } catch (error) {
        console.error('Error fetching user activity:', error)
        process.exit(1)
    }

    if (dataEvents.length === 0) {
        console.error('No activity found for this user.')
        process.exit(0)
    }

    const eventByType = getEventsByType(dataEvents)

    const eventByTypeFormatted = getEventsByTypeFormatted(eventByType)

    for (let event in eventByTypeFormatted) {
        const dataFormatted = eventByTypeFormatted[event]
        events[event](dataFormatted)
    }
}

main()
