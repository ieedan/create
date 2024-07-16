<script lang="ts">
    import dark from "$lib/assets/icons/github-dark.svg"
    import light from "$lib/assets/icons/github-light.svg"
    import { mode } from "mode-watcher"
</script>

{#if $mode == "light"}
    <img src={light} alt="Github logo" {...$$restProps}>
{:else}
    <img src={dark} alt="Github logo" {...$$restProps}>
{/if}