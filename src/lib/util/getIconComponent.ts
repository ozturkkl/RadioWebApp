// Example usage:
// <svelte:component this={getIconComponent(link.iconLabel)} class="h-4 w-4" />
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

export type IconLabel =
    | 'Youtube'
    | 'Globe'
    | 'HeartHandshake'
    | 'Newspaper'
    | 'GraduationCap'
    | 'ShoppingCart'
    | 'ShoppingBasket'
    | 'HandHelping'
    | 'BookOpenText'
    | 'UserRound'
    | 'BookCopy'
    | 'Mail'
    | 'Link';

export function getIconComponent(name: IconLabel) {
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
        case 'Link':
            return LinkIcon;
        default:
            return LinkIcon;
    }
}
