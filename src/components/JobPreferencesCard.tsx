import { Trash2, MapPin, Briefcase, Calendar, DollarSign, Clock, Users, Cake, FileText, Search, X } from 'lucide-react'
import { formatAge, formatWage } from '@/lib/formatConditions'

interface UserJobPreferences {
  gender: string | null
  age: string | number | null
  place: string | null
  work_days: string | null
  start_time: string | null
  end_time: string | null
  hourly_wage: string | number | null
  category: string | null
  requirements: string | null
}

interface JobPreferencesCardProps {
  preferences: UserJobPreferences
  onReset: () => void
  onDelete?: () => void
  onSearch?: (includeRequirements: boolean) => void
  onDeleteField?: (field: keyof UserJobPreferences | Array<keyof UserJobPreferences>) => void
}

export default function JobPreferencesCard({ preferences, onReset, onDelete, onSearch, onDeleteField }: JobPreferencesCardProps) {
  const hasAnyPreference = Object.values(preferences).some(val => val !== null)

  return (
    <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden h-full flex flex-col">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">일자리 조건</h3>
          {onDelete && hasAnyPreference && (
            <button
              onClick={onDelete}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              title="조건 삭제"
            >
              <Trash2 size={18} className="text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* 조건 목록 - 모든 필드 항상 표시 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {/* 지역 */}
          <div className={`p-3 rounded-lg border ${preferences.place ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${preferences.place ? 'text-blue-600' : 'text-gray-400'}`}>
                  <MapPin size={14} />
                  <span>지역</span>
                </div>
                <div className={`text-sm font-semibold ${preferences.place ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preferences.place || '설정 안 됨'}
                </div>
              </div>
              {preferences.place && onDeleteField && (
                <button
                  onClick={() => onDeleteField('place')}
                  className="p-1 hover:bg-red-100 rounded transition-all ml-2"
                  title="삭제"
                >
                  <X size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>

          {/* 성별 */}
          <div className={`p-3 rounded-lg border ${preferences.gender ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${preferences.gender ? 'text-pink-600' : 'text-gray-400'}`}>
                  <Users size={14} />
                  <span>성별</span>
                </div>
                <div className={`text-sm font-semibold ${preferences.gender ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preferences.gender || '설정 안 됨'}
                </div>
              </div>
              {preferences.gender && onDeleteField && (
                <button
                  onClick={() => onDeleteField('gender')}
                  className="p-1 hover:bg-red-100 rounded transition-all ml-2"
                  title="삭제"
                >
                  <X size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>

          {/* 나이 */}
          <div className={`p-3 rounded-lg border ${preferences.age ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${preferences.age ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <Cake size={14} />
                  <span>나이</span>
                </div>
                <div className={`text-sm font-semibold ${preferences.age ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preferences.age ? formatAge(preferences.age) : '설정 안 됨'}
                </div>
              </div>
              {preferences.age && onDeleteField && (
                <button
                  onClick={() => onDeleteField('age')}
                  className="p-1 hover:bg-red-100 rounded transition-all ml-2"
                  title="삭제"
                >
                  <X size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>

          {/* 직종 */}
          <div className={`p-3 rounded-lg border ${preferences.category ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${preferences.category ? 'text-purple-600' : 'text-gray-400'}`}>
                  <Briefcase size={14} />
                  <span>직종</span>
                </div>
                <div className={`text-sm font-semibold ${preferences.category ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preferences.category || '설정 안 됨'}
                </div>
              </div>
              {preferences.category && onDeleteField && (
                <button
                  onClick={() => onDeleteField('category')}
                  className="p-1 hover:bg-red-100 rounded transition-all ml-2"
                  title="삭제"
                >
                  <X size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>

          {/* 근무일 */}
          <div className={`p-3 rounded-lg border ${preferences.work_days ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${preferences.work_days ? 'text-green-600' : 'text-gray-400'}`}>
                  <Calendar size={14} />
                  <span>근무일</span>
                </div>
                <div className={`text-sm font-semibold ${preferences.work_days ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preferences.work_days || '설정 안 됨'}
                </div>
              </div>
              {preferences.work_days && onDeleteField && (
                <button
                  onClick={() => onDeleteField('work_days')}
                  className="p-1 hover:bg-red-100 rounded transition-all ml-2"
                  title="삭제"
                >
                  <X size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>

          {/* 근무 시간 */}
          <div className={`p-3 rounded-lg border ${preferences.start_time && preferences.end_time ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${preferences.start_time && preferences.end_time ? 'text-orange-600' : 'text-gray-400'}`}>
                  <Clock size={14} />
                  <span>근무 시간</span>
                </div>
                <div className={`text-sm font-semibold ${preferences.start_time && preferences.end_time ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preferences.start_time && preferences.end_time 
                    ? `${preferences.start_time} ~ ${preferences.end_time}` 
                    : '설정 안 됨'}
                </div>
              </div>
              {(preferences.start_time || preferences.end_time) && onDeleteField && (
                <button
                  onClick={() => onDeleteField(['start_time', 'end_time'])}
                  className="p-1 hover:bg-red-100 rounded transition-all ml-2"
                  title="삭제"
                >
                  <X size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>

          {/* 시급 */}
          <div className={`p-3 rounded-lg border ${preferences.hourly_wage ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${preferences.hourly_wage ? 'text-yellow-600' : 'text-gray-400'}`}>
                  <DollarSign size={14} />
                  <span>최저 시급</span>
                </div>
                <div className={`text-sm font-semibold ${preferences.hourly_wage ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preferences.hourly_wage ? formatWage(preferences.hourly_wage) : '설정 안 됨'}
                </div>
              </div>
              {preferences.hourly_wage && onDeleteField && (
                <button
                  onClick={() => onDeleteField('hourly_wage')}
                  className="p-1 hover:bg-red-100 rounded transition-all ml-2"
                  title="삭제"
                >
                  <X size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>

          {/* 추가 조건 */}
          <div className={`p-3 rounded-lg border ${preferences.requirements ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${preferences.requirements ? 'text-teal-600' : 'text-gray-400'}`}>
                  <FileText size={14} />
                  <span>추가 조건</span>
                </div>
                <div className={`text-sm font-semibold ${preferences.requirements ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preferences.requirements || '설정 안 됨'}
                </div>
              </div>
              {preferences.requirements && onDeleteField && (
                <button
                  onClick={() => onDeleteField('requirements')}
                  className="p-1 hover:bg-red-100 rounded transition-all ml-2"
                  title="삭제"
                >
                  <X size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 검색 버튼 */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={() => onSearch?.(false)}
            className="flex-1 px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center text-sm font-medium"
          >
            검색(일반)
          </button>
          <button
            onClick={() => onSearch?.(true)}
            disabled={!preferences.requirements}
            className={`flex-1 px-3 py-2.5 rounded-lg transition-all flex items-center justify-center text-sm font-medium ${
              preferences.requirements
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!preferences.requirements ? '추가 조건을 입력해주세요' : '추가 조건으로 하이브리드 검색'}
          >
            검색(일반+추가조건)
          </button>
        </div>
      </div>
    </div>
  )
}
