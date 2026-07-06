import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState } from "react"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

function App() {
  const editorRef = useRef(null)
  const [username, setUsername] = useState(()=>{
    return new URLSearchParams(window.location.search).get("username") || ""
  }
  )

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor

    const provider = new SocketIOProvider("http://localhost:3000", "monaco", ydoc, {
      autoConnect: true,
    })

    const monacoBinding = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    )
  }

  const handleJoin = (e) => {
    e.preventDefault()
    setUsername(e.target.username.value)
    window.history.pushState({}, "", `?username=${e.target.username.value}`)
  }

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
        <aside className='h-full w-1/4 bg-amber-50 rounded-lg'></aside>
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