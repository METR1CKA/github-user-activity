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

// Función para obtener los eventos agrupados por tipo de evento
function getEventsByType(dataEvents) {
    const eventsByType = dataEvents.map((event) => event.type)

    const setEventTypes = new Set(eventsByType)

    const uniqueEventTypes = [...setEventTypes]

    const objectEventTypes = {}

    for (let eventType of uniqueEventTypes) {
        const formatter = eventFormatter[eventType]

        if (!formatter) continue

        const dataFiltered = dataEvents.filter(
            (event) => event.type === eventType,
        )

        objectEventTypes[eventType] = formatter(dataFiltered)
    }

    return objectEventTypes
}

// Función para obtener la actividad del usuario
async function getUserActivity(username) {
    const URL = GITHUB_API_URL.replace('<username>', username)

    return await fetch(URL, { method: 'GET' })
}

// Objeto que contiene las funciones para formatear cada tipo de evento
const eventFormatter = {
    PushEvent: (events) => {
        const dataMap = events.map((ev) => ({
            type: ev?.type ?? 'No type',
            actor: ev?.actor?.login ?? 'Unknown',
            repoName: ev?.repo?.name ?? 'Unknown',
            actor: ev?.actor?.login ?? 'Unknown',
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
    },
    WatchEvent: (events) => {
        return events.map((ev) => ({
            type: ev?.type ?? 'No type',
            repoName: ev?.repo?.name ?? 'Unknown',
            action: ev?.payload?.action ?? 'Unknown',
            isPublicRepo: ev?.public ?? false,
            org: ev?.org?.login ?? 'Unknown',
        }))
    },
    CreateEvent: (events) => {
        const data = events.map((ev) => ({
            type: ev?.type ?? 'No type',
            actor: ev?.actor?.login ?? 'Unknown',
            repoName: ev?.repo?.name ?? 'Unknown',
            branch: ev?.payload?.master_branch ?? 'Unknown',
            description: ev?.payload?.description ?? null,
            isPublicRepo: ev?.public ?? false,
        }))

        const uniqueRepos = data.reduce((acc, ev) => {
            const repoKey = ev.repoName
            if (!acc[repoKey]) {
                acc[repoKey] = ev
            }
            return acc
        }, {})

        return Object.values(uniqueRepos)
    },
}

// Objeto que contiene las funciones para cada tipo de evento
const events = {
    PushEvent: (eventObject) => {
        for (let repoName in eventObject) {
            const event = eventObject[repoName]

            console.log(
                `- ${event.type}: ${event.count} commits to ${repoName} by ${event.actor}`,
            )
        }
    },
    WatchEvent: (events) => {
        for (let event of events) {
            console.log(
                `- ${event.type}: ${event.action} ${
                    event.isPublicRepo ? 'public' : 'private'
                } ${event.repoName}${
                    !event.org.includes('Unknown') ? ` by ${event.org}` : ''
                }`,
            )
        }
    },
    CreateEvent: (events) => {
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
    },
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

        dataEvents = Array.isArray(data) ? [...data] : []
    } catch (error) {
        console.error('Error fetching user activity:', error)
        process.exit(1)
    }

    if (dataEvents.length === 0) {
        console.error('No activity found for this user.')
        process.exit(0)
    }

    const eventsByType = getEventsByType(dataEvents)

    for (let event in eventsByType) {
        const eventFunc = events[event]

        if (!eventFunc) continue

        const data = eventsByType[event]

        eventFunc(data)
    }
}

main()
