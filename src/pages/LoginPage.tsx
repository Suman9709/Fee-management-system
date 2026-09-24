import { useState, type FormEvent } from "react"
import { LockIcon, UserIcon } from "@phosphor-icons/react"

type Role = "Admin" | "Office Staff" | "Student"

const roles: Role[] = ["Admin", "Office Staff", "Student"]

const LoginPage = () => {
  const [role, setRole] = useState<Role>("Admin")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const selectRole = (nextRole: Role) => {
    setRole(nextRole)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

   
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0a10] text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.12fr)_minmax(470px,0.88fr)]">
        <section
          className="relative hidden min-h-screen overflow-hidden bg-cover bg-center lg:block"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1800&q=85')",
          }}
        >
          <div className="absolute inset-0 bg-[#0d0d17]/77" />
          <div className="absolute inset-0 bg-linear-to-r from-[#101018]/70 via-[#0b0b13]/40 to-[#0b0a10]" />
          <div className="relative flex h-full max-w-3xl items-center px-[11%] py-16">
            <div className="max-w-xl">
              <p className="mb-7 text-sm font-bold tracking-[0.22em] text-[#e0b947]">
                FEE MANAGEMENT SYSTEM
              </p>
              <h1 className="text-5xl leading-[1.12] font-semibold tracking-[-0.045em] xl:text-6xl">
                Simplifying Fees &amp;
                <br />
                Student Success
              </h1>
              <p className="mt-8 max-w-lg text-lg leading-8 text-zinc-300">
                Access your secure institution portal to manage fee records,
                payments, receipts, and student account information.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center bg-[#0b0a10] px-5 py-8 sm:px-9 lg:px-12">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(224,185,71,0.07),transparent_70%)]" />
          <div className="relative w-full max-w-[625px] rounded-2xl border border-white/[0.07] bg-[#101017]/95 px-6 py-9 shadow-2xl shadow-black/30 sm:px-12 sm:py-11 lg:px-14">
            <form onSubmit={handleSubmit}>
              <header className="mb-11 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-xl border border-[#e0b947]/25 bg-gradient-to-br from-[#3d2c09] via-[#171108] to-[#09090d] shadow-lg shadow-black/30">
                  <span className="font-serif text-4xl font-bold italic text-[#e6bd46]">FM</span>
                </div>
                <h2 className="text-3xl font-semibold tracking-[-0.05em] text-zinc-50">
                  Fee Management
                </h2>
                <p className="mt-2 text-base text-zinc-400">Unified Institutional Portal</p>
              </header>

              <div className="mb-7">
                <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-400">
                  ACCESS WORKSPACE ROLE
                </p>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/[0.05] bg-[#0b0b11] p-1 sm:grid-cols-3">
                  {roles.map((item) => (
                    <button
                      className={`h-10 rounded-md px-2 text-xs font-semibold whitespace-nowrap transition-colors ${role === item
                          ? "bg-[#1f1f2a] text-white shadow-sm"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                        }`}
                      key={item}
                      onClick={() => selectRole(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mb-6 block">
                <span className="mb-3 block text-xs font-semibold tracking-wide text-zinc-400">
                  USERNAME
                </span>
                <span className="flex h-14 items-center gap-3 rounded-md border border-white/[0.08] bg-[#191922] px-4 transition focus-within:border-[#e0b947]/70 focus-within:ring-2 focus-within:ring-[#e0b947]/15">
                  <UserIcon aria-hidden="true" className="shrink-0 text-zinc-500" size={21} />
                  <input
                    autoComplete="username"
                    className="h-full w-full bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-600"
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    type="text"
                    value={username}
                  />
                </span>
              </label>

              <label className="mb-8 block">
                <span className="mb-3 block text-xs font-semibold tracking-wide text-zinc-400">
                  PASSWORD
                </span>
                <span className="flex h-14 items-center gap-3 rounded-md border border-white/[0.08] bg-[#191922] px-4 transition focus-within:border-[#e0b947]/70 focus-within:ring-2 focus-within:ring-[#e0b947]/15">
                  <LockIcon aria-hidden="true" className="shrink-0 text-zinc-500" size={21} />
                  <input
                    autoComplete="current-password"
                    className="h-full w-full bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-600"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                  />
                </span>
              </label>

              <button
                className="h-14 w-full rounded-lg bg-[#dfb94b] text-base font-bold text-[#17120a] shadow-[0_8px_24px_rgba(214,171,52,0.12)] transition hover:bg-[#ecc95e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0b947] active:translate-y-px"
                type="submit"
              >
                Log In to Portal
              </button>


            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
