import {getOwnerProfile, updateOwnerProfile} from '../../services/ownerApi.js'
import { useEffect, useState } from 'react'

const emptyProfile = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
}

export default function OwnerProfile() {
    const [profile, setProfile] = useState(emptyProfile)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')


    useEffect(() => {
        let cancelled = false

        async function loadProfile() {
            try {
                const data = await getOwnerProfile()

                if (!cancelled) {
                    setProfile({
                        fullName: data.fullName ?? '',
                        email: data.email ?? '',
                        phone: data.phone ?? '',
                        address: data.address ?? '',
                    })
                    setError('')
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Không thể tải hồ sơ.')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadProfile()

        return () => {
            cancelled = true
        }
    }, [])


    function handleChange(event) {
        const { name, value } = event.target

        setProfile((current) => ({
            ...current,
            [name]: value,
        }))

        setMessage('')
        setError('')
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)
        setMessage('')
        setError('')


        try {
            const data = await updateOwnerProfile(profile)

            if (data) {
                setProfile({
                    fullName: data.fullName ?? profile.fullName,
                    email: data.email ?? profile.email,
                    phone: data.phone ?? profile.phone,
                    address: data.address ?? profile.address,
                })
            }

            setMessage('Cập nhật hồ sơ thành công.')
        } catch (err) {
            setError(err.message || 'Không thể lưu hồ sơ.')
        } finally {
            setSaving(false)
        }
    }


        const fields = [
        {
            name: 'fullName',
            label: 'Họ và tên',
            placeholder: 'Nhập họ và tên',
            type: 'text',
            required: true,
        },
        {
            name: 'email',
            label: 'Email',
            placeholder: 'example@email.com',
            type: 'email',
            required: true,
        },
        {
            name: 'phone',
            label: 'Số điện thoại',
            placeholder: 'Nhập số điện thoại',
            type: 'tel',
            required: false,
        },
    ]

    if (loading) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Đang tải hồ sơ...
            </div>
        )
    }

    return (
        <section className="min-h-full p-5 md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <p className="mb-1 text-sm text-gray-500">
                        Owner / Hồ sơ cá nhân
                    </p>

                    <h1 className="text-2xl font-bold text-slate-800">
                        Hồ sơ cá nhân
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Quản lý thông tin liên hệ và thông tin tài khoản của bạn.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-7"
                >
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h2 className="font-semibold text-slate-800">
                            Thông tin cơ bản
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Vui lòng kiểm tra thông tin trước khi lưu.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        {fields.map((field) => (
                            <div key={field.name}>
                                <label
                                    htmlFor={field.name}
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    {field.label}
                                    {field.required && (
                                        <span className="ml-1 text-red-500">*</span>
                                    )}
                                </label>

                                <input
                                    id={field.name}
                                    name={field.name}
                                    type={field.type}
                                    value={profile[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#F45116] focus:ring-2 focus:ring-orange-100"
                                />
                            </div>
                        ))}

                        <div className="md:col-span-2">
                            <label
                                htmlFor="address"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Địa chỉ
                            </label>

                            <textarea
                                id="address"
                                name="address"
                                value={profile.address}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Nhập địa chỉ liên hệ"
                                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#F45116] focus:ring-2 focus:ring-orange-100"
                            />
                        </div>
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    {message && (
                        <p
                            role="status"
                            className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700"
                        >
                            {message}
                        </p>
                    )}

                    <div className="mt-7 flex justify-end border-t border-gray-100 pt-5">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-[#F45116] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#dc4210] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    )
}
