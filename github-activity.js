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

function pushEvent(event) {
    const repoName = event?.repo?.name ?? 'Unknown'

    const commitCount = event?.payload?.commits?.length ?? 0

    console.log(
        `- Pushed ${commitCount} commit${
            commitCount > 1 ? 's' : ''
        } to ${repoName}`,
    )
}

function issuesEvent(event) {
    const repoName = event?.repo?.name ?? 'Unknown'

    const action = event?.payload?.action ?? 'Unknown'

    console.log(
        `- ${
            action.charAt(0).toUpperCase() + action.slice(1)
        } an issue in ${repoName}`,
    )
}

function issueCommentEvent(event) {
    const repoName = event?.repo?.name ?? 'Unknown'

    console.log(`- Commented on an issue in ${repoName}`)
}

function pullRequestEvent(event) {
    const repoName = event?.repo?.name ?? 'Unknown'

    const action = event?.payload?.action ?? 'Unknown'

    console.log(
        `- ${
            action.charAt(0).toUpperCase() + action.slice(1)
        } a pull request in ${repoName}`,
    )
}

function watchEvent(event) {
    const repoName = event?.repo?.name ?? 'Unknown'

    console.log(`- Watched ${repoName}`)
}

function createEvent(event) {
    const repoName = event?.repo?.name ?? 'Unknown'

    console.log(`- Created a repository ${repoName}`)
}

function forkEvent(event) {
    const repoName = event?.repo?.name ?? 'Unknown'

    console.log(`- Forked a repository ${repoName}`)
}

// Objeto que contiene las funciones para cada tipo de evento
const events = {
    PushEvent: pushEvent,
    IssuesEvent: issuesEvent,
    IssueCommentEvent: issueCommentEvent,
    PullRequestEvent: pullRequestEvent,
    WatchEvent: watchEvent,
    CreateEvent: createEvent,
    ForkEvent: forkEvent,
}

// Función para obtener la actividad del usuario
async function getUserActivity(username) {
    const URL = GITHUB_API_URL.replace('<username>', username)

    return await fetch(URL, { method: 'GET' })
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

        dataEvents = await response.json()
    } catch (error) {
        console.error('Error fetching user activity:', error)
        process.exit(1)
    }

    if (dataEvents.length === 0) {
        console.error('No activity found for this user.')
        process.exit(0)
    }

    for (let event of dataEvents) {
        events[event.type](event)
    }
}

main()
