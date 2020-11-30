export default function InputForm(props) {
    let name = btoa(Math.random());
    function onSubmit(e) {
        e.preventDefault();
        props.onSubmit(e.target[name].value);
    }
    return <form onSubmit={onSubmit}>
        <label htmlFor={name}>{props.label}</label>
        <input name={name} />
        <input type="submit" />
    </form>
};
