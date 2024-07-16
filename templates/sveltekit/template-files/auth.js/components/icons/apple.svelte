<script lang="ts">
    import dark from "$lib/assets/icons/apple-dark.svg"
    import light from "$lib/assets/icons/apple-light.svg"
    import { mode } from "mode-watcher"
</script>

{#if $mode == "light"}
    <img src={light} alt="Apple logo" {...$$restProps}>
{:else}
    <img src={dark} alt="Apple logo" {...$$restProps}>
{/if}