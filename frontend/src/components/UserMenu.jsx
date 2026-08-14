import { useState, useRef, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/react'

function getInitial(user) {
  const name = user.fullName || user.username || user.primaryEmailAddress?.emailAddress || '?'
  return name.trim().charAt(0).toUpperCase()
}

function UserMenu() {
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!user) return null

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.hasImage ? (
          <img className="user-menu-avatar" src={user.imageUrl} alt={user.fullName || 'User'} />
        ) : (
          <span className="user-menu-avatar user-menu-avatar--initials">{getInitial(user)}</span>
        )}
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            <strong>{user.fullName || 'User'}</strong>
            <span>{user.primaryEmailAddress?.emailAddress}</span>
          </div>
          <button type="button" role="menuitem" className="user-menu-item" onClick={() => openUserProfile()}>
            Manage account
          </button>
          <button type="button" role="menuitem" className="user-menu-item" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
