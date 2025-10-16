// Name-based icon resolver that imports only the specific icons we use.
// Returns the component constructor synchronously so it can be used in
// <svelte:component this={...} />.
import {
    Youtube,
    Globe,
    HeartHandshake,
    Newspaper,
    GraduationCap,
    ShoppingCart,
    ShoppingBasket,
    HandHelping,
    BookOpenText,
    UserRound,
    BookCopy,
    Mail,
    Link as LinkIcon
} from 'lucide-svelte';

export function getIconComponent(name: string) {
    switch (name) {
        case 'Youtube':
            return Youtube;
        case 'Globe':
            return Globe;
        case 'HeartHandshake':
            return HeartHandshake;
        case 'Newspaper':
            return Newspaper;
        case 'GraduationCap':
            return GraduationCap;
        case 'ShoppingCart':
            return ShoppingCart;
        case 'ShoppingBasket':
            return ShoppingBasket;
        case 'HandHelping':
            return HandHelping;
        case 'BookOpenText':
            return BookOpenText;
        case 'UserRound':
            return UserRound;
        case 'BookCopy':
            return BookCopy;
        case 'Mail':
            return Mail;
        default:
            return LinkIcon;
    }
}
