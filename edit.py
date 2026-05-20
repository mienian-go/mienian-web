import os
path = os.path.join('c:\\', 'Users', 'Seto Raffa Aditiya', '.gemini', 'antigravity', 'playground', 'mienian-mobile', 'src', 'app', 'mienian-go', 'page.tsx')
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''            {/* MENU CATALOG (Appended so users can still order!) */}
            <div id="menu-catalog-section" className="pt-4 pb-12">
               <div className="bg-white rounded-t-[2rem] rounded-b-[2rem] shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-4 text-center border-b border-gray-100">
                   <h3 className="font-black text-[15px] text-gray-800">Menu Kami</h3>
                 </div>'''

replacement = '''            {/* MENU CATALOG */}
            <div id="menu-catalog-section" className="pt-4 pb-12">
               {!state.driverId ? (
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                    <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-black text-gray-800 mb-2">Pilih KangDoMie Dulu!</h3>
                    <p className="text-xs text-gray-500">Pilih gerobak KangDoMie di peta dan pilih metode pengiriman (Delivery/Pickup) untuk melihat stok menu yang tersedia.</p>
                 </div>
               ) : (
               <div className="bg-white rounded-t-[2rem] rounded-b-[2rem] shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-4 text-center border-b border-gray-100">
                   <h3 className="font-black text-[15px] text-gray-800">Menu Tersedia ({state.driverName || "KangDoMie"})</h3>
                 </div>'''

content = content.replace(target, replacement)
content = content.replace('''                 <div className="p-5 pt-0">
                    <button 
                      className="bg-[#C8102E] text-white rounded-full py-3.5 w-full text-xs font-black tracking-wide flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                    >
                      LIHAT SEMUA MENU
                      <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>
               </div>''', '''                 <div className="p-5 pt-0">
                    <button 
                      className="bg-[#C8102E] text-white rounded-full py-3.5 w-full text-xs font-black tracking-wide flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                    >
                      LIHAT SEMUA MENU
                      <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>
               </div>
               )}''')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
