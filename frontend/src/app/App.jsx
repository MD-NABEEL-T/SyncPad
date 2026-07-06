import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

function App() {
  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  })
  const [users, setUsers] = useState([])
  const [editor, setEditor] = useState(null)

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const handleMount = (editorInstance) => {
    setEditor(editorInstance)
  }

  const handleJoin = (e) => {
    e.preventDefault()
    setUsername(e.target.username.value)
    window.history.pushState({}, "", `?username=${e.target.username.value}`)
  }

  useEffect(() => {
    if (username && editor) {
      const provider = new SocketIOProvider("http://localhost:3000", "monaco-room", ydoc, {
        autoConnect: true,
      })

      provider.awareness.setLocalStateField("user", { username })

      provider.awareness.on("change", () => {
        const states = Array.from(provider.awareness.getStates().values())
        setUsers(states.filter(state => state.user).map(state => state.user.username))
      })

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null)
      }
      window.addEventListener("beforeunload", handleBeforeUnload)

      const monacoBinding = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor]),
        provider.awareness
      )

      return () => {
        monacoBinding.destroy()
        provider.disconnect()
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
    }
  }, [editor, username])

  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center">
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            name="username"
            type="text"
            placeholder="Enter your username"
            className="p-2 rounded-lg bg-gray-800 text-white"
          />
          <button className="p-2 rounded-lg bg-blue-500 text-white">
            Join
          </button>
        </form>
      </main>
    )
  }

  return (
    <>
      <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
        <aside className='h-full w-1/4 bg-amber-50 rounded-lg'>
          <h2 className='text-lg font-bold p-4 border-b border-gray-300'>Users</h2>
          <ul className='p-4'>
            {users.map((user, index) => (
              <li key={index} className='p-2 border-b border-gray-300'>{user}</li>
            ))}
          </ul>
        </aside>
        <section className='w-3/4 bg-neutral-800 rounded-lg overflow-hidden'>
          <Editor
            height="100%"
            language="javascript"
            theme="vs-dark"
            onMount={handleMount}
          />
        </section>
      </main>
    </>
  )
}

export default App