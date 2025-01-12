# wemo-rent-demo

此專案為Wemo面試前的小作業，需求如下：

1. 使用 Node JS 實做出租借車輛 API。
2. 限制同一個人同時間只能租借一台車，一台車同時也只能被一個人使用。
3. 需要連接關聯型資料庫，資料庫種類不拘。
4. 基本資料表: User, Scooter, Rent。
5. 需要紀錄使用者租車的起迄時間。

---

## 租借API情境模擬圖![專案設計架構圖](./assets/images/scooter_rental_system_diagram.png 'system flow chart')

## 專案內API說明

找車  
PATH：`/api/scooter/getLocation`  
說明：傳入經緯度之後可以取得附近的車輛

租車  
PATH：`/api/rent/rentScooter`  
說明：代入當前使用者ID與欲租借的機車ID，同時寫入開始租賃時間

還車
PATH：`/api/rent/returnScooter`  
說明：代入當前車輛ID，以及提供還車時當下的經緯度已更新車輛資訊

取得租車紀錄
PATH：`/api/rent/getRentInfo`  
說明：代入當前使用者ID，取得租車歷史紀錄

## 資料前提

- 每個User的id不會重複 (流水號)
- 每台車的id不會重複，就算相同車型也會有不同的車牌 (流水號)
- 每次租借只會產生一個事件（先排除租車後持續不還的狀況）
- 多個服務也只有一個Redis Server

## 模擬流程

1. 使用者使用App查詢當前位置一定範圍內可租借的車輛(getLocation)
2. 選擇該車輛後前端代入該使用者ID與欲租借的機車ID
3. 結束騎乘後傳入欲歸還的車輛ID以及當前經緯度，完成還車

## 設計重點解析 & 說明

### 針對題目主要處理的重點議題有兩個：

- 高併發時的處理方式 (Race Condition)
- 資料一致性

### Redis鎖選擇：

本專案基於Redis使用記憶體快速存取的特性，  
來實現分散式系統中處理高併發的鎖機制，  
有別於一般上鎖使用SET方式，使用的是SET NX來提高鎖的安全性，  
因為SET會無條件的覆蓋已經存在的Key值，  
在高併發時會產生部分Key被覆寫或產生複數同性質Key造成沒鎖好的問題，  
SET NX (Not Exists)只有當Key值不存在時，才會幫第一個抵達的請求完成設置鎖，  
後續的請求如果讀取到該鎖已經被設置，會回傳一個null供後續判斷，  
以此來避免多個請求爭搶同一個資源

> [!IMPORTANT]  
> 關於SET NX :
>
> > 如果使用Redis原生支援的`set(key, value, 'EX', ttl, 'NX')`，它本身就具有原子性的操作  
> > 但如果分開執行`setnx` 和 `expire`，視為兩個動作則無法保證原子性  
> > 例如在 SETNX 成功後，EXPIRE發生崩潰，則鎖將不會有過期時間，導致deadlock的風險。

### 處理死鎖：

關於官方文檔裡面針對SETNX的[說明](https://redis.io/docs/latest/commands/setnx/)  
如果單純使用DEL（key）直接依據KEY值當作判斷，會有誤刪的風險，  
文中推薦如果要避免過期時間重疊產生Race Condition問題，可以使用`GETSET`來確保原子操作，  
但本專案前提應該不會發生租車時間持續到過期時間還沒完成需要重設過期時間，  
故本專案中採用的是使用Lua腳本，  
取得Key之後檢查其中的Value是否與傳入的相同，相同的話才執行刪除操作來確保刪除動作安全性，  
腳本如下：

```lua
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
```

### 資料一致性處理：

本專案透過同一個connection內執行多項操作(CRUD)時，  
包入同一個Transaction內處理，完成後再一次Commit，  
如果失敗的話則會rollback到操作前的狀態，以此來確保資料的一致性，

另外在執行returnScooter時有個值得注意的地方，  
中間確認租車狀況getScooterInfo()有使用`FOR UPDATE`來鎖定該筆資料，  
如果沒有適當的處理connection release，會造成該筆資料高併發時變成deadLock的情形，  
導致Server請求被卡住，也無法對該筆資料做異動，  
所以設計上是確保所有情形都統一在finally釋放連線

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
