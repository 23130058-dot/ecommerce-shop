import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getOwnerChats, getOwnerChatMessages, sendOwnerChatMessage } from '../../services/ownerApi.js'
import { getProductChats, getProductChatMessages, getRentalChatMessages, getRenterChats, sendProductChatMessage, sendRentalChatMessage } from '../../services/shoppingApi.js'
import useCurrentAccount from '../../hooks/useCurrentAccount.js'
import { showToast } from '../../services/toast.js'

const messageTime = (value) => value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''

function threadKey(chat) {
  return chat.kind === 'product'
    ? `product:${chat.productId}:${chat.peerId}`
    : `${chat.kind}:${chat.rentalId}:${chat.ownerId || ''}`
}

export default function ChatWidget() {
  const { auth } = useCurrentAccount()
  const [open, setOpen] = useState(false)
  const [chats, setChats] = useState([])
  const [activeKey, setActiveKey] = useState('')
  const [messages, setMessages] = useState([])
  const [messageBody, setMessageBody] = useState('')
  const [loadingChats, setLoadingChats] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [messageError, setMessageError] = useState('')
  const pollingRef = useRef(false)
  const knownMessagesRef = useRef(null)
  const warnedRef = useRef(false)
  const messageListRef = useRef(null)
  const pendingProductChatsRef = useRef(new Map())
  const role = auth?.user?.role?.toUpperCase()
  const enabled = Boolean(auth?.accessToken) && role !== 'ADMIN'
  const unreadTotal = chats.reduce((total, chat) => total + Number(chat.unreadCount || 0), 0)
  const activeChat = chats.find((chat) => threadKey(chat) === activeKey)
  const accessToken = auth?.accessToken

  const refreshChats = useCallback(async () => {
    if (!enabled || pollingRef.current) return
    pollingRef.current = true
    setLoadingChats(knownMessagesRef.current === null)
    const [ownerResult, renterResult, productResult] = await Promise.allSettled([getOwnerChats(), getRenterChats(), getProductChats()])
    const hasSuccess = ownerResult.status === 'fulfilled' || renterResult.status === 'fulfilled' || productResult.status === 'fulfilled'
    if (!hasSuccess) {
      setLoadError('Không tải được tin nhắn. Vui lòng thử lại sau.')
      if (!warnedRef.current) {
        showToast('Không tải được danh sách tin nhắn.', 'error')
        warnedRef.current = true
      }
      setLoadingChats(false)
      pollingRef.current = false
      return
    }
    warnedRef.current = false
    setLoadError('')
    const ownerChats = ownerResult.status === 'fulfilled' && Array.isArray(ownerResult.value)
      ? ownerResult.value.filter((chat) => chat.lastMessageAt).map((chat) => ({
        kind: 'owner', kindLabel: 'Owner', rentalId: chat.rentalId, rentalCode: chat.rentalCode,
        ownerId: null, peerName: chat.renterName, lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt, unreadCount: chat.unreadCount || 0,
      }))
      : []
    const renterChats = renterResult.status === 'fulfilled' && Array.isArray(renterResult.value)
      ? renterResult.value.map((chat) => ({
        kind: 'renter', kindLabel: 'Renter', rentalId: chat.rentalId, rentalCode: chat.rentalCode,
        ownerId: chat.ownerId, peerName: chat.ownerName, lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt, unreadCount: chat.unreadCount || 0,
      }))
      : []
    const productChats = productResult.status === 'fulfilled' && Array.isArray(productResult.value)
      ? productResult.value.map((chat) => ({
        kind: 'product', kindLabel: 'Sản phẩm', productId: chat.productId, productName: chat.productName,
        ownerId: chat.ownerId, peerId: chat.peerId, peerName: chat.peerName,
        lastMessage: chat.lastMessage, lastMessageAt: chat.lastMessageAt, unreadCount: chat.unreadCount || 0,
      }))
      : []
    const persistedProductKeys = new Set(productChats.map(threadKey))
    for (const key of persistedProductKeys) pendingProductChatsRef.current.delete(key)
    const nextChats = [...ownerChats, ...renterChats, ...productChats, ...pendingProductChatsRef.current.values()]
      .sort((left, right) => new Date(right.lastMessageAt || 0) - new Date(left.lastMessageAt || 0))
    const nextKnown = Object.fromEntries(nextChats.map((chat) => [threadKey(chat), `${chat.lastMessageAt || ''}|${chat.lastMessage || ''}`]))
    if (knownMessagesRef.current) {
      for (const chat of nextChats) {
        const key = threadKey(chat)
        if (chat.unreadCount > 0 && knownMessagesRef.current[key] && knownMessagesRef.current[key] !== nextKnown[key]) {
          showToast(`Tin nhắn mới từ ${chat.peerName}.`, 'info')
        }
      }
    }
    knownMessagesRef.current = nextKnown
    setChats(nextChats)
    setLoadingChats(false)
    pollingRef.current = false
  }, [enabled, accessToken])

  useEffect(() => {
    if (!enabled) return undefined
    const openProductChat = (event) => {
      const detail = event.detail || {}
      if (!detail.productId || !detail.ownerId) return
      const chat = {
        kind: 'product', kindLabel: 'Sản phẩm', productId: detail.productId,
        productName: detail.productName || 'Thiết bị', ownerId: detail.ownerId,
        peerId: detail.ownerId, peerName: detail.peerName || 'Chủ thiết bị',
        lastMessage: '', lastMessageAt: null, unreadCount: 0,
      }
      const key = threadKey(chat)
      pendingProductChatsRef.current.set(key, chat)
      setChats((current) => current.some((item) => threadKey(item) === key) ? current : [chat, ...current])
      setActiveKey(key)
      setMessageBody('')
      setMessageError('')
      setOpen(true)
    }
    window.addEventListener('lensrent-open-product-chat', openProductChat)
    return () => window.removeEventListener('lensrent-open-product-chat', openProductChat)
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setChats([])
      setMessages([])
      setActiveKey('')
      setOpen(false)
      pendingProductChatsRef.current.clear()
      knownMessagesRef.current = null
      return undefined
    }
    knownMessagesRef.current = null
    setChats([])
    setMessages([])
    setActiveKey('')
    refreshChats()
    const intervalId = window.setInterval(refreshChats, 12000)
    window.addEventListener('focus', refreshChats)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshChats)
    }
  }, [enabled, refreshChats])

  const fetchMessages = useCallback(async (chat, active, refreshList = false) => {
    try {
      const rows = chat.kind === 'owner'
        ? await getOwnerChatMessages(chat.rentalId)
        : chat.kind === 'renter'
          ? await getRentalChatMessages(chat.rentalId, chat.ownerId)
          : await getProductChatMessages(chat.productId, chat.peerId)
      if (!active) return
      setMessages(Array.isArray(rows) ? rows : [])
      setMessageError('')
      if (refreshList) refreshChats()
    } catch (error) {
      if (active) setMessageError(error.message || 'Không tải được nội dung trò chuyện.')
    } finally {
      if (active) setLoadingMessages(false)
    }
  }, [refreshChats])

  useEffect(() => {
    if (!open || !activeChat) {
      setMessages([])
      return undefined
    }
    let active = true
    setLoadingMessages(true)
    fetchMessages(activeChat, active, true)
    const intervalId = window.setInterval(() => fetchMessages(activeChat, active), 5000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [open, activeChat?.kind, activeChat?.rentalId, activeChat?.ownerId, activeChat?.productId, activeChat?.peerId, fetchMessages])

  useEffect(() => {
    if (messageListRef.current) messageListRef.current.scrollTop = messageListRef.current.scrollHeight
  }, [messages, open, activeKey])

  const send = async (event) => {
    event.preventDefault()
    if (!messageBody.trim() || !activeChat) return
    setSending(true)
    setMessageError('')
    try {
      const sent = activeChat.kind === 'owner'
        ? await sendOwnerChatMessage(activeChat.rentalId, { body: messageBody.trim() })
        : activeChat.kind === 'renter'
          ? await sendRentalChatMessage(activeChat.rentalId, activeChat.ownerId, messageBody.trim())
          : await sendProductChatMessage(activeChat.productId, activeChat.peerId, messageBody.trim())
      setMessages((current) => [...current, sent])
      setMessageBody('')
      showToast('Tin nhắn đã được gửi.', 'success')
      refreshChats()
    } catch (error) {
      setMessageError(error.message || 'Không gửi được tin nhắn.')
      showToast(error.message || 'Không gửi được tin nhắn.', 'error')
    } finally {
      setSending(false)
    }
  }

  const unreadLabel = useMemo(() => unreadTotal > 9 ? '9+' : String(unreadTotal), [unreadTotal])
  if (!enabled) return null

  return (
    <div className="fixed bottom-5 right-5 z-[65] font-sans text-gray-900">
      {open && <section aria-label="Trò chuyện LensRent" className="mb-3 flex h-[min(34rem,calc(100dvh-7rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.22)]">
        <header className="flex items-center gap-3 bg-[#ff5500] px-4 py-3 text-white">
          {activeChat && <button aria-label="Quay lại danh sách trò chuyện" className="rounded-lg p-1 text-white/90 hover:bg-white/15" onClick={() => { setActiveKey(''); setMessages([]); setMessageError('') }} type="button">←</button>}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{activeChat ? activeChat.peerName : 'Tin nhắn LensRent'}</p><p className="mt-0.5 truncate text-[11px] text-white/80">{activeChat ? activeChat.kind === 'product' ? activeChat.productName : `Đơn ${activeChat.rentalCode} · ${activeChat.kindLabel}` : 'Trao đổi với Owner và Renter'}</p></div>
          <button aria-label="Đóng chatbox" className="rounded-lg px-2 py-1 text-xl leading-none text-white/90 hover:bg-white/15" onClick={() => setOpen(false)} type="button">×</button>
        </header>

        {activeChat ? <>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9fc] p-3" ref={messageListRef}>
            {messageError && <p role="alert" className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">{messageError}</p>}
            {loadingMessages && !messages.length ? <p className="py-8 text-center text-xs text-gray-500">Đang tải tin nhắn…</p> : messages.length ? messages.map((message) => <div className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`} key={message.id}><div className={`max-w-[85%] rounded-2xl px-3 py-2 ${message.mine ? 'rounded-br-md bg-[#ff5500] text-white' : 'rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm'}`}><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p><p className={`mt-1 text-right text-[10px] ${message.mine ? 'text-white/70' : 'text-gray-400'}`}>{messageTime(message.createdAt)}</p></div></div>) : <p className="py-8 text-center text-xs text-gray-500">Chưa có tin nhắn trong cuộc trò chuyện này.</p>}
          </div>
          <form className="flex items-end gap-2 border-t border-gray-100 p-3" onSubmit={send}>
            <textarea aria-label="Nội dung tin nhắn" className="max-h-24 min-h-10 min-w-0 flex-1 resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400" maxLength={2000} onChange={(event) => setMessageBody(event.target.value)} placeholder="Nhập tin nhắn…" rows={1} value={messageBody} />
            <button className="h-10 rounded-xl bg-[#ff5500] px-3 text-sm font-bold text-white disabled:opacity-50" disabled={sending || !messageBody.trim()} type="submit">{sending ? '…' : 'Gửi'}</button>
          </form>
        </> : <div className="flex-1 overflow-y-auto">
          {loadError && <div role="alert" className="m-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{loadError}<button className="ml-2 font-bold underline" onClick={refreshChats} type="button">Thử lại</button></div>}
          {loadingChats && !chats.length ? <p className="py-10 text-center text-sm text-gray-500">Đang tải cuộc trò chuyện…</p> : chats.length ? <div className="divide-y divide-gray-100">{chats.map((chat) => <button className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50" key={threadKey(chat)} onClick={() => { setActiveKey(threadKey(chat)); setMessageError('') }} type="button"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-lg text-[#ff5500]">{chat.kind === 'owner' ? 'R' : chat.kind === 'product' ? '▣' : 'O'}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-gray-800">{chat.peerName}</span><span className="shrink-0 text-[10px] text-gray-400">{messageTime(chat.lastMessageAt)}</span></span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">{chat.kindLabel}{chat.kind === 'product' ? ` · ${chat.productName}` : ` · Đơn ${chat.rentalCode}`}</span><span className="mt-1 block truncate text-xs text-gray-500">{chat.lastMessage || 'Bắt đầu cuộc trò chuyện'}</span></span>{Number(chat.unreadCount) > 0 && <span className="mt-1 flex min-w-5 items-center justify-center rounded-full bg-[#ff5500] px-1.5 py-0.5 text-[10px] font-bold text-white">{chat.unreadCount > 9 ? '9+' : chat.unreadCount}</span>}</button>)}</div> : !loadError && <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-orange-50 text-2xl text-[#ff5500]">▤</span><p className="mt-3 text-sm font-bold text-gray-800">Chưa có tin nhắn</p><p className="mt-1 text-xs leading-5 text-gray-500">Các cuộc trò chuyện theo đơn thuê hoặc sản phẩm sẽ xuất hiện ở đây.</p></div>}
        </div>}
      </section>}

      <button aria-expanded={open} aria-label={`Mở tin nhắn${unreadTotal ? `, ${unreadTotal} chưa đọc` : ''}`} className="ml-auto flex h-14 items-center gap-2 rounded-full bg-[#ff5500] px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(244,81,22,0.35)] transition hover:-translate-y-0.5 hover:bg-orange-600" onClick={() => setOpen((value) => !value)} type="button">
        <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M7 9h10M7 13h6m-8 7 1.8-3.7A8 8 0 1 1 20 17H9.5L5 20Z" /></svg>
        <span>Tin nhắn</span>
        {unreadTotal > 0 && <span className="flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-[#ff5500]">{unreadLabel}</span>}
      </button>
    </div>
  )
}
