import { useEffect, useState } from 'react'
import AdminLayout, { AdminIcon } from '../components/admin/AdminLayout.jsx'
import DataTable from '../components/shared/DataTable.jsx'
import { getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from '../services/adminApi.js'

function StatusBadge({ status }) {
  const active = status === 'active'
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><span className={`size-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'}`} />{active ? 'Hoạt động' : 'Đã khóa'}</span>
}

function RoleBadge({ role }) {
  const normalized = role?.toUpperCase()
  const label = normalized === 'OWNER' ? 'Owner' : normalized === 'ADMIN' ? 'Admin' : 'Renter'
  const tone = normalized === 'OWNER' ? 'bg-violet-50 text-violet-700' : normalized === 'ADMIN' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
  return <span className={`rounded-md px-2 py-1 text-[10px] font-medium ${tone}`}>{label}</span>
}

function mapUser(user) {
  const createdAt = user.createdAt ? new Date(user.createdAt) : null
  return {
    id: user.id,
    code: `USR-${String(user.id).padStart(4, '0')}`,
    name: user.fullName || 'Chưa cập nhật tên',
    email: user.email,
    phone: user.phone || '—',
    role: user.role || 'RENTER',
    joined: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toLocaleDateString('vi-VN') : '—',
    rentals: Number(user.rentalCount) || 0,
    status: user.status?.toUpperCase() === 'ACTIVE' ? 'active' : 'locked',
  }
}

function DetailModal({ user, onClose, onRoleChange, savingRole, roleError }) {
  const [role, setRole] = useState(user?.role || 'RENTER')
  if (!user) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="user-detail-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-[#f45116]">Hồ sơ người dùng</p><h2 id="user-detail-title" className="mt-1 text-lg font-bold text-gray-900">{user.name}</h2></div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><AdminIcon name="close" /></button>
        </div>
        <dl className="mt-5 grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 rounded-xl bg-gray-50 p-4 text-xs">
          <dt className="text-gray-500">Mã người dùng</dt><dd className="font-semibold text-gray-800">{user.code}</dd>
          <dt className="text-gray-500">Email</dt><dd className="break-all font-medium text-gray-800">{user.email}</dd>
          <dt className="text-gray-500">Số điện thoại</dt><dd className="font-medium text-gray-800">{user.phone}</dd>
          <dt className="text-gray-500">Vai trò</dt><dd className="flex flex-wrap items-center gap-2"><RoleBadge role={user.role} /><select aria-label="Vai trò mới" value={role.toUpperCase()} onChange={(event) => setRole(event.target.value)} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-orange-400"><option value="RENTER">Renter</option><option value="OWNER">Owner</option><option value="ADMIN">Admin</option></select><button type="button" disabled={savingRole || role.toUpperCase() === user.role.toUpperCase()} onClick={async () => { const updated = await onRoleChange(user, role); if (updated) setRole(updated.role) }} className="rounded-md bg-orange-500 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{savingRole ? 'Đang lưu…' : 'Lưu vai trò'}</button></dd>
          <dt className="text-gray-500">Ngày tham gia</dt><dd className="font-medium text-gray-800">{user.joined}</dd>
          <dt className="text-gray-500">Đơn thuê</dt><dd className="font-medium text-gray-800">{user.rentals}</dd>
          <dt className="text-gray-500">Trạng thái</dt><dd><StatusBadge status={user.status} /></dd>
        </dl>
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-4 text-amber-800">Vai trò mới có hiệu lực sau khi người dùng đăng nhập lại. Không thể tự đổi quyền tài khoản Admin đang sử dụng.</p>
        {roleError && <p role="alert" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-700">{roleError}</p>}
        <div className="mt-5 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Đóng</button></div>
      </section>
    </div>
  )
}

function exportUsersCsv(users) {
  const rows = [['Mã', 'Họ tên', 'Email', 'Điện thoại', 'Vai trò', 'Ngày tham gia', 'Đơn thuê', 'Trạng thái'], ...users.map((user) => [user.code, user.name, user.email, user.phone, user.role, user.joined, user.rentals, user.status === 'active' ? 'Hoạt động' : 'Đã khóa'])]
  const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'lensrent-nguoi-dung.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [summary, setSummary] = useState(null)
  const [totalElements, setTotalElements] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [savingRole, setSavingRole] = useState(false)
  const [roleError, setRoleError] = useState('')
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const pageSize = 10

  useEffect(() => {
    let current = true
    const timeout = window.setTimeout(() => {
      setLoading(true)
      getAdminUsers({
        search: query,
        role: roleFilter,
        status: statusFilter === 'active' ? 'ACTIVE' : statusFilter === 'locked' ? 'LOCKED' : 'all',
        page: page - 1,
        size: pageSize,
      })
        .then((response) => {
          if (!current) return
          setUsers((response.users || []).map(mapUser))
          setSummary(response.summary || null)
          setTotalElements(response.totalElements || 0)
          setPageCount(Math.max(response.totalPages || 0, 1))
          setError('')
        })
        .catch((requestError) => {
          if (current) setError(requestError.message)
        })
        .finally(() => {
          if (current) setLoading(false)
        })
    }, query ? 250 : 0)
    return () => {
      current = false
      window.clearTimeout(timeout)
    }
  }, [query, roleFilter, statusFilter, page, pageSize, refreshVersion])

  const changeFilter = (callback, value) => {
    callback(value)
    setPage(1)
  }

  const toggleStatus = async (user) => {
    setUpdatingId(user.id)
    setError('')
    try {
      const response = await updateAdminUserStatus(user.id, user.status === 'active' ? 'LOCKED' : 'ACTIVE')
      const updatedUser = mapUser(response)
      setSelectedUser((current) => current?.id === user.id ? updatedUser : current)
      setRefreshVersion((current) => current + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const changeRole = async (user, role) => {
    setSavingRole(true)
    setRoleError('')
    setError('')
    try {
      const response = await updateAdminUserRole(user.id, role)
      const updatedUser = mapUser(response)
      setSelectedUser(updatedUser)
      setUsers((current) => current.map((item) => item.id === user.id ? updatedUser : item))
      setRefreshVersion((current) => current + 1)
      return updatedUser
    } catch (requestError) {
      setRoleError(requestError.message)
      return null
    } finally {
      setSavingRole(false)
    }
  }

  const visibleUsers = users
  const columns = [
    { key: 'name', header: 'Người dùng', className: 'min-w-[220px]', render: (user) => <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[11px] font-bold text-[#e94b0a]">{user.name.split(' ').slice(-2).map((part) => part[0]).join('')}</span><div className="min-w-0"><p className="text-xs font-semibold text-gray-800">{user.name}</p><p className="mt-0.5 text-[11px] text-gray-400">{user.email}</p><p className="mt-0.5 text-[10px] text-gray-300">{user.code}</p></div></div> },
    { key: 'role', header: 'Vai trò', render: (user) => <RoleBadge role={user.role} /> },
    { key: 'joined', header: 'Ngày tham gia', className: 'whitespace-nowrap' },
    { key: 'rentals', header: 'Đơn thuê' },
    { key: 'status', header: 'Trạng thái', render: (user) => <StatusBadge status={user.status} /> },
    { key: 'actions', header: 'Thao tác', searchable: false, sortable: false, className: 'min-w-[210px] whitespace-nowrap text-right', cellClassName: 'whitespace-nowrap text-right', render: (user) => <div className="flex flex-nowrap items-center justify-end gap-2"><button type="button" onClick={() => setSelectedUser(user)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"><AdminIcon name="eye" className="size-3.5" />Chi tiết</button><button type="button" disabled={updatingId === user.id} onClick={() => toggleStatus(user)} className={`whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[10px] font-semibold disabled:cursor-wait disabled:opacity-50 ${user.status === 'active' ? 'border-rose-100 text-rose-600 hover:bg-rose-50' : 'border-emerald-100 text-emerald-700 hover:bg-emerald-50'}`}>{updatingId === user.id ? 'Đang lưu…' : user.status === 'active' ? 'Khóa' : 'Mở khóa'}</button></div> },
  ]

  return (
    <AdminLayout>
      <main className="min-w-0">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-[22px] font-bold tracking-tight text-[#1f2937] sm:text-[24px]">Quản lý người dùng</h1></div>
            <p className="mt-1 text-[11px] leading-5 text-gray-500 sm:text-xs">Theo dõi tài khoản, vai trò và trạng thái hoạt động trên LensRent.</p>
          </div>
          <button type="button" onClick={() => exportUsersCsv(users)} disabled={loading || users.length === 0} className="inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-[#f45116] px-3.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#df4610] disabled:cursor-not-allowed disabled:opacity-50"><AdminIcon name="download" className="size-3.5" />Xuất danh sách trang này</button>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Tổng quan người dùng">
          <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-[10px] font-bold tracking-wide text-gray-500">TỔNG TÀI KHOẢN</p><p className="mt-2 text-2xl font-bold text-gray-800">{summary?.totalUsers ?? '—'}</p><p className="mt-1 text-[10px] text-emerald-600">+{summary?.newUsersThisMonth ?? '—'} tài khoản mới tháng này</p></article>
          <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-[10px] font-bold tracking-wide text-gray-500">ĐANG HOẠT ĐỘNG</p><p className="mt-2 text-2xl font-bold text-gray-800">{summary?.activeUsers ?? '—'}</p><p className="mt-1 text-[10px] text-gray-400">Tài khoản có thể sử dụng LensRent</p></article>
          <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-[10px] font-bold tracking-wide text-gray-500">TÀI KHOẢN ĐÃ KHÓA</p><p className="mt-2 text-2xl font-bold text-gray-800">{summary?.lockedUsers ?? '—'}</p><p className="mt-1 text-[10px] text-rose-600">Không thể đăng nhập khi bị khóa</p></article>
        </section>

        <section className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div><h2 className="text-[13px] font-bold text-gray-800">Danh sách tài khoản</h2><p className="mt-1 text-[10px] text-gray-400">Tra cứu và cập nhật trạng thái người dùng từ PostgreSQL</p></div>
            <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 text-gray-400 focus-within:border-orange-400 sm:max-w-[290px]"><AdminIcon name="search" className="size-4 shrink-0" /><input value={query} onChange={(event) => changeFilter(setQuery, event.target.value)} placeholder="Tìm tên, email hoặc mã..." aria-label="Tìm người dùng" className="min-w-0 flex-1 bg-transparent text-[11px] text-gray-700 outline-none placeholder:text-gray-400" /></label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:px-5">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo trạng thái">
              {[['all', 'Tất cả'], ['active', 'Hoạt động'], ['locked', 'Đã khóa']].map(([value, label]) => <button key={value} onClick={() => changeFilter(setStatusFilter, value)} type="button" aria-pressed={statusFilter === value} className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold ${statusFilter === value ? 'bg-orange-50 text-[#e94b0a]' : 'text-gray-500 hover:bg-gray-50'}`}>{label}</button>)}
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-500"><AdminIcon name="filter" className="size-3.5" /><span>Vai trò</span><select value={roleFilter} onChange={(event) => changeFilter(setRoleFilter, event.target.value)} className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[10px] text-gray-700 outline-none focus:border-orange-400"><option value="all">Tất cả</option><option value="renter">Renter</option><option value="owner">Owner</option><option value="admin">Admin</option></select></label>
          </div>
          <DataTable columns={columns} rows={visibleUsers} rowKey={(user) => user.id} loading={loading} error={error} emptyMessage="Không tìm thấy tài khoản phù hợp." page={page - 1} pageCount={pageCount} totalElements={totalElements} size={pageSize} onPageChange={(nextPage) => setPage(nextPage + 1)} />
        </section>
        <p className="mb-1 mt-4 text-center text-[10px] text-gray-400">Dữ liệu người dùng và thao tác trạng thái được lấy từ PostgreSQL.</p>
      </main>
      <DetailModal key={selectedUser?.id || 'closed'} user={selectedUser} savingRole={savingRole} roleError={roleError} onRoleChange={changeRole} onClose={() => setSelectedUser(null)} />
    </AdminLayout>
  )
}
