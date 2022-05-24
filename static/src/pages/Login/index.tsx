import { h } from "preact";
import { useState } from "preact/hooks";
import { changeValue } from "../../utils/htmlevent";
import { clientLogin } from "../../stores";

const Login: () => h.JSX.Element = () => {
    const [qid, setQid] = useState("");
    const [qPass, setQPass] = useState("");
    const [userPass, setUserPass] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [loading, setLoading] = useState(false);

    const inputHasError = () => {
        if (!(/^\d{6,12}$/).test(qid)) {
            return "请输入正确的QQ号, 只支持数字";
        }
        if (!(/^.{6,32}$/).test(userPass)) {
            return "请输入正确的用户密码, QQ密码可以留空, 仅在本应用使用";
        }
        return false;
    };

    const doLogin = async () => {
        const errMsg = inputHasError();
        if (errMsg) {
            setErrorMsg(errMsg);
            return;
        } else if (errorMsg.length > 0) {
            setErrorMsg("");
        }
        setLoading(true);
        try {
            const res = await clientLogin(qid, qPass, userPass);
            if (res) {
                if (!res.isOnline) {
                    if (res.loginImage) {
                        setQrCode(res.loginImage);
                    }
                    if (res.loginError) {
                        setErrorMsg(res.loginError);
                    }
                }
            } else {
                setErrorMsg("登录失败, 请检查您的登录信息");
            }
        } catch {
            setErrorMsg("登录失败，请检查网络连接并确认服务器在线");
        } finally {
            setLoading(false);
        }
        //
    };

    return <div className="w-full h-full flex flex-col items-center">
        <div className="w-full h-full sm:max-w-sm flex sm:items-center sm:overflow-y-auto">
            <div className="card w-full h-full sm:h-fit flex flex-col overflow-y-auto sm:overflow-hidden">
                <div className="flex-none text-lg font-bold pb-2">登录</div>
                <div className="pt-2 sm:flex-auto">
                    <div className="cursor-pointer w-full tooltip hover:underline" data-tooltip="QQ数字帐号">QQ号</div>
                    <input className="input" value={qid} onChange={changeValue(setQid)} />
                </div>
                <div className="pt-2 sm:flex-auto">
                    <div className="cursor-pointer w-full tooltip hover:underline" data-tooltip="QQ登录密码, 建议前几次登录留空扫码登录, 长期使用之后再使用密码登录">QQ密码(可选)</div>
                    <input className="input" type="password" value={qPass} onChange={changeValue(setQPass)} />
                </div>
                <div className="pt-2 sm:flex-auto">
                    <div className="cursor-pointer w-full tooltip hover:underline" data-tooltip="用户自定义密码, 首次登录时设置, 退出QQ再重新登录可以重新设置. 与QQ密码无关, 仅用于多设备验证">用户密码</div>
                    <input className="input" type="password" value={userPass} onChange={changeValue(setUserPass)} />
                </div>
                {errorMsg.length > 0 ? <div className="flex-none pt-2 text-red-600">{errorMsg}</div> : null}
                {qrCode.length > 0 ? <div className="flex-none pt-2 flex flex-col items-center">
                    <img src={qrCode} />
                </div> : null}
                {qrCode.length > 0 ? <div className="flex-none pt-2">请使用手机QQ扫描二维码, 确认登录, 然后再次点击下面的登录按钮</div> : null}
                <div className="pt-2 sm:flex-auto flex flex-col items-center">
                    <button className="btn btn-primary w-16" onClick={doLogin} disabled={loading}>登录</button>
                </div>
            </div>
        </div>
    </div>;
};

export default Login;
